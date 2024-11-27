import { BadRequestException, Body, Controller, Delete, Get, Header, NotFoundException, Param, Post } from '@nestjs/common';
import type { Project, TodoType, User as UserT } from '@prisma/client';
import { readFileSync } from 'fs';
import { Protected } from 'src/auth/protected.decorator';
import { type FSTree } from 'src/fs/fs.model';
import { FSService } from 'src/fs/fs.service';
import { GHService } from 'src/gh/gh.service';
import { TodosService } from 'src/todos/todos.service';
import { User } from 'src/utils/decorators/user.decorator';
import { AddTypeDTO, CreateProjectDTO } from './dtos';
import { type SimpleProject } from './models';
import { ProjectsService } from './projects.service';

@Controller('/projects')
export class ProjectsController {
	public constructor(
		private readonly service: ProjectsService,
		private readonly gh: GHService,
		private readonly fs: FSService,
		private readonly todos: TodosService
	) {}

	@Protected()
	@Get('/')
	public async getUserProjects(@User() user: UserT): Promise<(SimpleProject & { lastCommit: string; lastCommitter: string })[]> {
		return this.service.getAll({ ownerId: user.id }).then((projects) =>
			Promise.all(
				projects.map(async (project) => {
					const lastCommit = await this.gh.getLatestCommit(user.installation_id, user.name, project.url);

					return {
						...project,
						lastCommit: lastCommit.commit.author?.date!,
						lastCommitter: lastCommit.commit.author?.name!
					};
				})
			)
		);
	}

	@Protected()
	@Get('/available')
	public async getAvailableRepos(@User() user: UserT) {
		return this.gh.getRepos(user.installation_id);
	}

	@Protected()
	@Post('/new')
	public async clone(@User() user: UserT, @Body() data: CreateProjectDTO): Promise<Project> {
		const available = await this.gh.getRepos(user.installation_id);

		if (available.some((repo) => repo.html_url === data.url)) {
			const project = await this.service.createProject(user, data);

			await this.todos.scanProject(project.id);

			return project;
		} else {
			throw new NotFoundException('Repo does not exist or installation is not authorized to access repo');
		}
	}

	@Protected()
	@Get('/:id/types')
	public async getTypes(@User() user: UserT, @Param('id') projectId: string): Promise<TodoType[]> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		return project.todoTypes;
	}

	@Protected()
	@Get('/:id/collaborators')
	public async getCollaborators(@User() user: UserT, @Param('id') projectId: string): Promise<Pick<UserT, 'id' | 'name' | 'color'>[]> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		return project.collaborators.map(({ id, name, color }) => ({ id, name, color })).filter((u) => u.id !== user.id);
	}

	@Protected()
	@Post('/:id/types/new')
	public async addType(@User() user: UserT, @Param('id') projectId: string, @Body() data: AddTypeDTO): Promise<TodoType[]> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.addType(projectId, data);

		return this.service.getFull({ id: projectId }).then((project) => project!.todoTypes);
	}

	@Protected()
	@Delete('/:id/types/:name')
	public async deleteType(@User() user: UserT, @Param('id') projectId: string, @Param('name') name: string): Promise<TodoType[]> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.deleteType(projectId, name);

		return this.service.getFull({ id: projectId }).then((project) => project!.todoTypes);
	}

	@Protected()
	@Get('/:id/tree')
	public async getProjectTree(@User() user: UserT, @Param('id') projectId: string): Promise<FSTree> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		return this.fs.tree(`repos/${projectId}`, (p) => !project.ignoredPaths.some(({ path }) => path === p));
	}

	@Protected()
	@Get('/:id/tree/:path(*)')
	@Header('Content-Type', 'text/plain')
	public async getProjectFile(@User() user: UserT, @Param('id') projectId: string, @Param('path') path: string): Promise<string> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		try {
			return readFileSync(`repos/${project.id}/${path}`).toString();
		} catch (err) {
			console.error(err);
			throw new BadRequestException(`Path '${path}' in project ${project.id} does not exist`);
		}
	}
}

