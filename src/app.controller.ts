import { Body, Controller, Delete, Get, HttpRedirectResponse, HttpStatus, Param, Post, Query, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { GHService } from './gh/gh.service';
import type { PostAuthRecord, PostInstallRecord, PushRecord } from './gh/models';
import { GitService } from './git/git.service';
import { ProjectsService } from './projects/projects.service';
import { TodosService } from './todos/todos.service';
import { UsersService } from './users/users.service';
import { Page } from './utils/decorators/page.decorator';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly git: GitService,
		private readonly projects: ProjectsService,
		private readonly gh: GHService,
		private readonly users: UsersService,
		private readonly todos: TodosService
	) {}

	@Page()
	@Get('/admin/users')
	public async usersPage(): Promise<PageProps<{ users: User[] }>> {
		const users = await this.users.getAll();

		return {
			users
		};
	}

	@Get('/auth')
	@Redirect()
	public async auth(@Query() query: PostAuthRecord | PostInstallRecord): Promise<HttpRedirectResponse> {
		const ghUser = await this.gh.getUser(query.code);

		if ('setup_action' in query) {
			const user = await this.users.register(parseInt(query.installation_id), ghUser);

			return {
				statusCode: HttpStatus.SEE_OTHER,
				url: `http://localhost:3000/claim?token=${user.token}`
			};
		} else {
			const user = await this.users.login(ghUser);

			if (user) {
				return {
					statusCode: HttpStatus.SEE_OTHER,
					url: `http://localhost:3000/claim?token=${user.token}`
				};
			} else {
				return {
					statusCode: HttpStatus.SEE_OTHER,
					url: 'http://localhost:3000/signup?error=unregistered'
				};
			}
		}
	}

	@Post('/webhooks')
	public async test(@Body() body: PushRecord): Promise<void> {
		console.log(body.commits);
		console.log('full body', body);
		const project = await this.projects.get({ url: body.repository.url });

		if (project) {
			await this.projects.syncProject(project.id);
			await this.todos.scanProject(project.id);
		}
	}

	@Delete('/:id')
	public async delete(@Param('id') id: string): Promise<void> {
		return this.projects.deleteProject(id);
	}
}

