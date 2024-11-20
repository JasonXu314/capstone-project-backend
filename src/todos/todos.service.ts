import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import type { Prisma, Project, TodoItem, User } from '@prisma/client';
import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { DBService } from 'src/db/db.service';
import { FSService } from 'src/fs/fs.service';
import { GHService } from 'src/gh/gh.service';
import { full, FullProject } from 'src/projects/models';
import { commentPrefix, extractWhitespace, generateTypeColor } from 'src/utils/utils';
import { EditTodoDTO, NewTodoDTO } from './dtos';
import { type TodoWithColor, withColor } from './models';

const COMMENT_PREFIXES = ['#', '//', '%', '--', "'", ';'];
const COMMENT_REGEXES = COMMENT_PREFIXES.map((prefix) => new RegExp(`^${prefix} (\\w+): (.+)$`));
const COMMENT_REGEXES_WITH_ID = COMMENT_PREFIXES.map((prefix) => new RegExp(`^${prefix} (\\w+): \\[([a-z0-9]{8})\\] (.+)$`));

@Injectable()
export class TodosService {
	private readonly cuid: () => string;

	public constructor(private readonly db: DBService, private readonly gh: GHService, private readonly fs: FSService) {
		this.cuid = init({ length: 8 });
	}

	public async getAll(where: Prisma.TodoItemWhereInput): Promise<TodoItem[]> {
		return this.db.todoItem.findMany({ where });
	}

	public async getAllWithColor(where: Prisma.TodoItemWhereInput): Promise<TodoWithColor[]> {
		return this.db.todoItem.findMany({ where, ...withColor });
	}

	public async create(data: Omit<Prisma.TodoItemCreateInput, 'id'>): Promise<TodoItem> {
		return this.db.todoItem.create({ data: { ...data, id: this.cuid() } });
	}

	public async scanProject(projectId: string): Promise<void> {
		const {
			ignoredPaths,
			owner: { installation_id, name },
			url
		} = (await this.db.project.findUnique({ where: { id: projectId }, ...full }))!;
		const ignored = ignoredPaths
			.map(({ path }) => path)
			.concat('.git')
			.map((path) => `repos/${projectId}/${path}`);

		const existingTodos = await this.db.todoItem.findMany({ where: { projectId } });
		const found = new Set<TodoItem>();

		for (const path of this.fs.traverse(`repos/${projectId}`, (path) => !ignored.includes(path))) {
			const contents = readFileSync(path).toString();
			const lines = contents.split('\n');

			const newLines: string[] = [];

			for (const line of lines) {
				const ln = line.trim();
				const matchIdx = COMMENT_REGEXES.findIndex((regex) => regex.test(ln));
				let match: RegExpMatchArray | null = null;

				if (matchIdx !== -1) {
					if ((match = COMMENT_REGEXES_WITH_ID[matchIdx].exec(ln)) !== null) {
						// existing todo in system (supposedly)
						const [, type, id, message] = match;

						const existing = existingTodos.find((todo) => todo.id === id);

						if (!existing) {
							// create with supplied ID
							await this.db.todoItem.create({
								data: {
									id,
									message,
									completed: false,
									typeData: {
										connectOrCreate: {
											where: { name_projectId: { name: type, projectId } },
											create: { name: type, color: generateTypeColor(), project: { connect: { id: projectId } } }
										}
									},
									project: { connect: { id: projectId } }
								}
							});
						} else {
							if (existing.type !== type || existing.message !== message) {
								await this.db.todoItem.update({
									where: { id_projectId: { projectId, id } },
									data: {
										message,
										typeData: {
											connectOrCreate: {
												where: { name_projectId: { name: type, projectId } },
												create: { name: type, color: generateTypeColor(), project: { connect: { id: projectId } } }
											}
										}
									}
								});
							}

							found.add(existing);
						}

						newLines.push(line);
					} else {
						// new todo, add ID
						match = COMMENT_REGEXES[matchIdx].exec(ln)!;
						const [, type, message] = match;
						const id = this.cuid();

						await this.db.todoItem.create({
							data: {
								id,
								message,
								completed: false,
								typeData: {
									connectOrCreate: {
										where: { name_projectId: { name: type, projectId } },
										create: { name: type, color: generateTypeColor(), project: { connect: { id: projectId } } }
									}
								},
								project: { connect: { id: projectId } }
							}
						});

						const preIdIdx = line.indexOf(COMMENT_PREFIXES[matchIdx]) + COMMENT_PREFIXES[matchIdx].length + 1 + type.length + 2;
						newLines.push(line.slice(0, preIdIdx) + `[${id}] ` + line.slice(preIdIdx));
					}
				} else {
					newLines.push(line);
				}
			}

			const newContents = newLines.join('\n');

			if (newContents !== contents) {
				const hash = createHash('sha1').update(`blob ${contents.length}\0${contents}`).digest().toString('hex');

				await this.gh.relpaceFile(installation_id, name, url, path.split('/').slice(2).join('/'), hash, newContents);
			}
		}

		const deleted = existingTodos.filter((todo) => !found.has(todo));
		await this.db.todoItem.updateMany({ where: { id: { in: deleted.map(({ id }) => id) } }, data: { completed: true } });
	}

	public async createTodo(project: Project, user: User, data: NewTodoDTO): Promise<void> {
		const path = `repos/${project.id}/${data.file}`;
		if (!existsSync(path)) {
			throw new NotFoundException('File does not exist');
		}

		const current = readFileSync(path).toString();
		const lines = current.split('\n');

		if (data.ln > lines.length) {
			throw new BadRequestException('Line number out of bounds');
		}

		const id = this.cuid();
		await this.db.todoItem.create({
			data: {
				id,
				message: data.message,
				completed: false,
				project: { connect: { id: project.id } },
				typeData: {
					connectOrCreate: {
						where: { name_projectId: { name: data.type, projectId: project.id } },
						create: { name: data.type, color: generateTypeColor(), project: { connect: { id: project.id } } }
					}
				}
			}
		});

		const wsPrefix = extractWhitespace(data.ln === lines.length ? lines[data.ln - 1] : lines[data.ln]);
		lines.splice(data.ln, 0, `${wsPrefix}${commentPrefix(path.split('.').at(-1)!)} ${data.type}: [${id}] ${data.message}`);

		const updated = lines.join('\n');
		const hash = createHash('sha1').update(`blob ${current.length}\0${current}`).digest().toString('hex');

		await this.gh.relpaceFile(user.installation_id, user.name, project.url, data.file, hash, updated, 'Todo item manual creation');
	}

	public async deleteTodo(project: FullProject, user: User, id: string): Promise<void> {
		await this.removeTodoComment(project, user, id);
		await this.db.todoItem.delete({ where: { id_projectId: { id, projectId: project.id } } });
	}

	public async completeTodo(project: FullProject, user: User, id: string): Promise<void> {
		await this.removeTodoComment(project, user, id);
		await this.db.todoItem.update({ where: { id_projectId: { id, projectId: project.id } }, data: { completed: true } });
	}

	public async removeTodoComment(project: FullProject, user: User, todoId: string): Promise<void> {
		const ignored = project.ignoredPaths
			.map(({ path }) => path)
			.concat('.git')
			.map((path) => `repos/${project.id}/${path}`);

		for (const path of this.fs.traverse(`repos/${project.id}`, (path) => !ignored.includes(path))) {
			const contents = readFileSync(path).toString();
			const lines = contents.split('\n');

			const newLines: string[] = [];

			for (const line of lines) {
				const ln = line.trim();
				const matchIdx = COMMENT_REGEXES.findIndex((regex) => regex.test(ln));
				let match: RegExpMatchArray | null = null;

				if (matchIdx !== -1) {
					if ((match = COMMENT_REGEXES_WITH_ID[matchIdx].exec(ln)) !== null) {
						const [, , id] = match;

						if (id !== todoId) {
							newLines.push(line);
						}
					}
				} else {
					newLines.push(line);
				}
			}

			const newContents = newLines.join('\n');

			if (newContents !== contents) {
				const hash = createHash('sha1').update(`blob ${contents.length}\0${contents}`).digest().toString('hex');

				await this.gh.relpaceFile(user.installation_id, user.name, project.url, path.split('/').slice(2).join('/'), hash, newContents);

				return;
			}
		}

		// TODO: consider throwing bad request or not found?
	}

	public async editTodo(project: FullProject, user: User, todoId: string, data: EditTodoDTO): Promise<void> {
		const ignored = project.ignoredPaths
			.map(({ path }) => path)
			.concat('.git')
			.map((path) => `repos/${project.id}/${path}`);

		for (const path of this.fs.traverse(`repos/${project.id}`, (path) => !ignored.includes(path))) {
			const contents = readFileSync(path).toString();
			const lines = contents.split('\n');

			const newLines: string[] = [];

			for (const line of lines) {
				const ln = line.trim();
				const matchIdx = COMMENT_REGEXES.findIndex((regex) => regex.test(ln));
				let match: RegExpMatchArray | null = null;

				if (matchIdx !== -1) {
					if ((match = COMMENT_REGEXES_WITH_ID[matchIdx].exec(ln)) !== null) {
						const [, , id, message] = match;

						if (id === todoId) {
							if ('message' in data) {
								newLines.push(line.replace(message, data.message!));
							} else {
								newLines.push(line);
							}
						} else {
							newLines.push(line);
						}
					}
				} else {
					newLines.push(line);
				}
			}

			const newContents = newLines.join('\n');

			if (newContents !== contents) {
				const hash = createHash('sha1').update(`blob ${contents.length}\0${contents}`).digest().toString('hex');

				await this.db.todoItem.update({ where: { id_projectId: { id: todoId, projectId: project.id } }, data });
				await this.gh.relpaceFile(user.installation_id, user.name, project.url, path.split('/').slice(2).join('/'), hash, newContents);
				return;
			}
		}

		// TODO: consider throwing bad request or not found?
	}
}

