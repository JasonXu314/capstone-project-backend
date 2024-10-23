import { Body, Controller, Delete, Get, HttpRedirectResponse, HttpStatus, Param, Post, Query, Redirect } from '@nestjs/common';
import { Project } from '@prisma/client';
import { AppService } from './app.service';
import { PostAuthRecord, PushRecord } from './gh/models';
import { GitService } from './git/git.service';
import { ProjectsService } from './projects/projects.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService, private readonly git: GitService, private readonly projects: ProjectsService) {}

	@Get('/')
	public getHello(): string {
		return this.appService.getHello();
	}

	@Get('/auth')
	@Redirect()
	public async auth(@Query() { code }: PostAuthRecord): Promise<HttpRedirectResponse> {
		return {
			statusCode: HttpStatus.SEE_OTHER,
			url: '/asdf'
		};
	}

	@Post('/webhooks')
	public test(@Body() body: PushRecord): void {
		console.log(body.commits);
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

