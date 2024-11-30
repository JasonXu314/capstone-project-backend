import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import type { Prisma, Project, TodoItem, User } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { DBService } from 'src/db/db.service';
import { FSService } from 'src/fs/fs.service';
import { GHService } from 'src/gh/gh.service';
import { full, FullProject } from 'src/projects/models';
import { commentPrefix, extractWhitespace, generateTypeColor } from 'src/utils/utils';
import { EditTodoDTO, NewTodoDTO, SetAssigneesDTO } from './dtos';
import { type TodoWithColor, withColor } from './models';

const COMMENT_PREFIXES = ['#', '//', '%', '--', "'", ';'];
const COMMENT_REGEXES = COMMENT_PREFIXES.map((prefix) => new RegExp(`^\\s*${prefix} ([^:]+): (.+)$`));
const COMMENT_REGEXES_WITH_ID = COMMENT_PREFIXES.map((prefix) => new RegExp(`^\\s*${prefix} ([^:]+): \\[([a-z0-9]{8})\\] (.+)$`));
const COMMENT_REGEXES_COMPLETED = COMMENT_PREFIXES.map((prefix) => new RegExp(`^\\s*${prefix} ([^:]+): \\[\\^([a-z0-9]{8})\\] (.+)$`));

@Injectable()
export class TodosService {
	private readonly cuid: () => string;

	public constructor(private readonly db: DBService, private readonly gh: GHService, private readonly fs: FSService) {
		this.cuid = init({ length: 8 });
	}

	public async getWithColor(where: Prisma.TodoItemWhereUniqueInput): Promise<TodoWithColor | null> {
		return this.db.todoItem
			.findUnique({ where, ...withColor })
			.then((todo) => (todo === null ? todo : { ...todo, assignees: todo.assignments.map((a) => a.user).filter((u) => u !== null) }));
	}

	public async getAll(where: Prisma.TodoItemWhereInput): Promise<TodoItem[]> {
		return this.db.todoItem.findMany({ where });
	}

	public async getAllWithColor(where: Prisma.TodoItemWhereInput): Promise<TodoWithColor[]> {
		return this.db.todoItem
			.findMany({ where, ...withColor })
			.then((todos) => todos.map((todo) => ({ ...todo, assignees: todo.assignments.map((a) => a.user).filter((u) => u !== null) })));
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
			.concat('.git', '.github')
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
					if ((match = COMMENT_REGEXES_COMPLETED[matchIdx].exec(ln)) !== null) {
						// existing todo in system (supposedly)
						const [, type, id, message] = match;

						if (!/\s/.test(type) || type.length <= 24) {
							const existing = existingTodos.find((todo) => todo.id === id);

							if (!existing) {
								// create with supplied ID
								await this.db.todoItem.create({
									data: {
										id,
										message,
										completed: true,
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
											completed: true,
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
						}

						newLines.push(line);
					} else if ((match = COMMENT_REGEXES_WITH_ID[matchIdx].exec(ln)) !== null) {
						// existing todo in system (supposedly)
						const [, type, id, message] = match;

						if (!/\s/.test(type) || type.length <= 24) {
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
						}

						newLines.push(line);
					} else {
						// new todo, add ID
						match = COMMENT_REGEXES[matchIdx].exec(ln)!;
						const [, type, message] = match;

						if (!/\s/.test(type) || type.length <= 24) {
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
				await this.gh.relpaceFile(installation_id, name, url, path.split('/').slice(2).join('/'), contents, newContents);
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

		await this.gh.relpaceFile(user.installation_id, user.name, project.url, data.file, current, updated, 'Todo item manual creation');
	}

	public async deleteTodo(project: FullProject, user: User, id: string): Promise<void> {
		await this.removeTodoComment(project, user, id);
		await this.db.todoItem.delete({ where: { id_projectId: { id, projectId: project.id } } });
	}

	public async completeTodo(project: FullProject, user: User, id: string): Promise<void> {
		await this.setTodoCommentCompleted(project, user, id, true);
		await this.db.todoItem.update({ where: { id_projectId: { id, projectId: project.id } }, data: { completed: true } });
	}

	public async uncompleteTodo(project: FullProject, user: User, id: string): Promise<void> {
		await this.setTodoCommentCompleted(project, user, id, false);
		await this.db.todoItem.update({ where: { id_projectId: { id, projectId: project.id } }, data: { completed: false } });
	}

	public async removeTodoComment(project: FullProject, user: User, todoId: string): Promise<void> {
		const ignored = project.ignoredPaths
			.map(({ path }) => path)
			.concat('.git', '.github')
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
				await this.gh.relpaceFile(
					user.installation_id,
					user.name,
					project.url,
					path.split('/').slice(2).join('/'),
					contents,
					newContents,
					'Todo item manual deletion'
				);

				return;
			}
		}

		// TODO: consider throwing bad request or not found?
	}

	public async setTodoCommentCompleted(project: FullProject, user: User, todoId: string, completed: boolean): Promise<void> {
		const ignored = project.ignoredPaths
			.map(({ path }) => path)
			.concat('.git', '.github')
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

						if (id === todoId) {
							newLines.push(completed ? line.replace(`[${id}]`, `[^${id}]`) : line.replace(`[^${id}]`, `[${id}]`));
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
				await this.gh.relpaceFile(
					user.installation_id,
					user.name,
					project.url,
					path.split('/').slice(2).join('/'),
					contents,
					newContents,
					'Todo item toggle completion'
				);
				return;
			}
		}

		// TODO: consider throwing bad request or not found?
	}

	public async editTodo(project: FullProject, user: User, todoId: string, data: EditTodoDTO): Promise<void> {
		const ignored = project.ignoredPaths
			.map(({ path }) => path)
			.concat('.git', '.github')
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
						const [, type, id, message] = match;

						if (id === todoId) {
							if ('message' in data && 'type' in data) {
								newLines.push(line.replace(message, data.message!).replace(`${type}:`, `${data.type!}:`));
							} else if ('message' in data) {
								newLines.push(line.replace(message, data.message!));
							} else {
								newLines.push(line.replace(`${type}:`, `${data.type!}:`));
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
				await this.db.todoItem.update({ where: { id_projectId: { id: todoId, projectId: project.id } }, data });
				await this.gh.relpaceFile(
					user.installation_id,
					user.name,
					project.url,
					path.split('/').slice(2).join('/'),
					contents,
					newContents,
					'Todo item manual edit'
				);
				return;
			}
		}

		// TODO: consider throwing bad request or not found?
	}

	public async setAssignees(project: FullProject, id: string, { assigneeIds }: SetAssigneesDTO): Promise<void> {
		if (assigneeIds.some((assigneeId) => !project.collaborators.some((user) => user.userId === assigneeId))) {
			throw new BadRequestException('One or more assigned user is not a collaborator on the project');
		}

		console.log(project, assigneeIds);
		await this.db.todoAssignment.deleteMany({ where: { projectId: project.id, todoId: id } });
		console.log('deleted');
		await this.db.todoAssignment.createMany({ data: assigneeIds.map((userId) => ({ projectId: project.id, todoId: id, userId })) });
		// await this.db.todoItem.update({
		// 	where: { id_projectId: { projectId: project.id, id } },
		// 	data: { assignments: { createMany: { data: assigneeIds.map((userId) => ({ userId })) } } }
		// });
		console.log('updated');
	}
}

