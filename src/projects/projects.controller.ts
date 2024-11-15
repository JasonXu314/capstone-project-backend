import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import type { Project, User as UserT } from '@prisma/client';
import { Protected } from 'src/auth/protected.decorator';
import { GHService } from 'src/gh/gh.service';
import { type TodoWithColor } from 'src/todos/models';
import { TodosService } from 'src/todos/todos.service';
import { User } from 'src/utils/decorators/user.decorator';
import { CreateProjectDTO } from './dtos';
import { type SimpleProject } from './models';
import { ProjectsService } from './projects.service';

@Controller('/projects')
export class ProjectsController {
	public constructor(private readonly service: ProjectsService, private readonly gh: GHService, private readonly todos: TodosService) {}

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
	@Get('/:id/todos')
	public async getTodos(@User() user: UserT, @Param('id') projectId: string): Promise<Record<string, TodoWithColor[]>> {
		const project = await this.service.getFull({ id: projectId });

		if (!project || !project.collaborators.some(({ id }) => id === user.id)) {
			throw new NotFoundException('Project does not exist');
		}

		const all = await this.todos.getAllWithColor({ projectId });

		return all.reduce<Record<string, TodoWithColor[]>>(
			(record, todo) => (todo.type in record ? { ...record, [todo.type]: [...record[todo.type], todo] } : { ...record, [todo.type]: [todo] }),
			{}
		);
	}
}

