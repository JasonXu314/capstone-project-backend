import { BadRequestException, Body, Controller, Delete, Get, Header, Logger, NotFoundException, Param, Post } from '@nestjs/common';
import type { TodoType, User as UserT } from '@prisma/client';
import { readFileSync } from 'fs';
import { Protected } from 'src/auth/protected.decorator';
import { type FSTree } from 'src/fs/fs.model';
import { FSService } from 'src/fs/fs.service';
import { GHService } from 'src/gh/gh.service';
import { TodosService } from 'src/todos/todos.service';
import { User } from 'src/utils/decorators/user.decorator';
import { AddTypeDTO, CreateProjectDTO } from './dtos';
import { NonNullCollaborator, type SimpleProject } from './models';
import { ProjectsService } from './projects.service';

@Controller('/projects')
export class ProjectsController {
	private readonly logger = new Logger('Projects');

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
	public async clone(@User() user: UserT, @Body() data: CreateProjectDTO): Promise<SimpleProject & { lastCommit: string; lastCommitter: string }> {
		const available = await this.gh.getRepos(user.installation_id);

		if (available.some((repo) => repo.html_url === data.url)) {
			const project = await this.service.createProject(user, data);

			await this.todos.scanProject(project.id);

			const lastCommit = await this.gh.getLatestCommit(user.installation_id, user.name, project.url);

			return {
				...project,
				lastCommit: lastCommit.commit.author?.date!,
				lastCommitter: lastCommit.commit.author?.name!
			};
		} else {
			throw new NotFoundException('Repo does not exist or installation is not authorized to access repo');
		}
	}

	@Protected()
	@Get('/:id/types')
	public async getTypes(@User() user: UserT, @Param('id') projectId: string): Promise<TodoType[]> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		return project.todoTypes;
	}

	@Protected()
	@Get('/:id/collaborators')
	public async getCollaborators(
		@User() user: UserT,
		@Param('id') projectId: string
	): Promise<(Pick<UserT, 'id' | 'name' | 'color'> & { avatar: string })[]> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		return project.collaborators
			.filter((u) => u.userId !== user.id)
			.filter((u): u is NonNullCollaborator => u.user !== null)
			.map(({ user: { id, name, color }, avatar }) => ({ id, name, color, avatar }));
	}

	@Protected()
	@Post('/:id/types/new')
	public async addType(@User() user: UserT, @Param('id') projectId: string, @Body() data: AddTypeDTO): Promise<TodoType[]> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.addType(projectId, data);

		return this.service.getFull({ id: projectId }).then((project) => project!.todoTypes);
	}

	@Protected()
	@Delete('/:id/types/:name')
	public async deleteType(@User() user: UserT, @Param('id') projectId: string, @Param('name') name: string): Promise<TodoType[]> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.deleteType(projectId, name);

		return this.service.getFull({ id: projectId }).then((project) => project!.todoTypes);
	}

	@Protected()
	@Get('/:id/tree')
	public async getProjectTree(@User() user: UserT, @Param('id') projectId: string): Promise<FSTree> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		const ignored = project.ignoredPaths
			.map(({ path }) => path)
			.concat('.git', '.github')
			.map((path) => `repos/${project.id}/${path}`);

		return this.fs.tree(`repos/${projectId}`, (p) => !ignored.includes(p));
	}

	@Protected()
	@Get('/:id/tree/:path(*)')
	@Header('Content-Type', 'text/plain')
	public async getProjectFile(@User() user: UserT, @Param('id') projectId: string, @Param('path') path: string): Promise<string> {
		const project = await this.service.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

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

