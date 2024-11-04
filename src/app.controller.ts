import { Body, Controller, Delete, Get, HttpRedirectResponse, HttpStatus, Param, Post, Query, Redirect } from '@nestjs/common';
import { Project, User } from '@prisma/client';
import { AppService } from './app.service';
import { GHService } from './gh/gh.service';
import { PostAuthRecord, PostInstallRecord, PushRecord } from './gh/models';
import { GitService } from './git/git.service';
import { ProjectsService } from './projects/projects.service';
import { UsersService } from './users/users.service';
import { Page } from './utils/decorators/page.decorator';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly git: GitService,
		private readonly projects: ProjectsService,
		private readonly gh: GHService,
		private readonly users: UsersService
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
	public test(@Body() body: PushRecord): void {
		console.log(body.commits);
		console.log('full body', body);
		this.projects.syncProject(body.repository.url);
	}

	@Post('/clone')
	public async clone(@Body('url') url: string, @Body('name') name: string): Promise<Project> {
		return this.projects.createProject(name, url);
	}

	@Delete('/:id')
	public async delete(@Param('id') id: string): Promise<void> {
		return this.projects.deleteProject(id);
	}
}

