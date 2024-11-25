import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import type { Prisma, Project, User } from '@prisma/client';
import { existsSync, rmSync } from 'fs';
import { DBService } from 'src/db/db.service';
import { GHService } from 'src/gh/gh.service';
import { GitService } from 'src/git/git.service';
import { generateTypeColor } from 'src/utils/utils';
import { AddTypeDTO, CreateProjectDTO } from './dtos';
import { full, FullProject, SimpleProject } from './models';

@Injectable()
export class ProjectsService {
	private readonly cuid: () => string;

	public constructor(private readonly db: DBService, private readonly gh: GHService, private readonly git: GitService) {
		this.cuid = init({ length: 16 });
	}

	public async getAll(where: Prisma.ProjectWhereInput): Promise<SimpleProject[]> {
		return this.db.project.findMany({ where });
	}

	public async get(where: Prisma.ProjectWhereUniqueInput): Promise<SimpleProject | null> {
		return this.db.project.findUnique({ where });
	}

	public async getFull(where: Prisma.ProjectWhereUniqueInput): Promise<FullProject | null> {
		return this.db.project.findUnique({ where, ...full });
	}

	public async createProject(user: User, { name, url }: CreateProjectDTO): Promise<Project> {
		const id = this.cuid();

		const project = await this.db.project.create({
			data: {
				id,
				owner: { connect: { id: user.id } },
				name,
				url,
				collaborators: {
					connect: { id: user.id }
				}
			}
		});

		const token = await this.gh.getToken(user.installation_id);

		await this.git.clone(url, id, token);

		return project;
	}

	public async syncProject(id: string): Promise<void> {
		if (!existsSync(`repos/${id}`)) {
			throw new InternalServerErrorException(`Missing repo ${id}`);
		}

		return this.git.pull(id);
	}

	public async deleteProject(id: string): Promise<void> {
		await this.db.project.delete({ where: { id } });
		rmSync(`repos/${id}`, { recursive: true, force: true });
	}

	public async addType(id: string, data: AddTypeDTO): Promise<void> {
		await this.db.todoType.create({ data: { project: { connect: { id } }, name: data.name, color: generateTypeColor() } });
	}

	public async deleteType(id: string, name: string): Promise<void> {
		const todos = await this.db.todoItem.findMany({ where: { projectId: id, type: name } });

		if (todos.length > 0) {
			throw new BadRequestException('There are unresolved items of that type, resolve them first before deleting the type');
		}

		await this.db.todoType.delete({ where: { name_projectId: { projectId: id, name } } });
	}
}

