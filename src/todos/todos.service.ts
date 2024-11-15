import { Injectable } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import type { Prisma, TodoItem } from '@prisma/client';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { DBService } from 'src/db/db.service';
import { FSService } from 'src/fs/fs.service';
import { GHService } from 'src/gh/gh.service';
import { full } from 'src/projects/models';
import { generateTypeColor } from 'src/utils/utils';
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

						const existing = await this.db.todoItem.findUnique({ where: { id_projectId: { projectId, id } } });

						if (!existing) {
							// create with supplied ID
							await this.db.todoItem.create({
								data: {
									id,
									message,
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
	}
}

