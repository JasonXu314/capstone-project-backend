import { Body, Controller, Get, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppService } from './app.service';
import { GitService } from './git/git.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService, private readonly git: GitService) {}

	@Get('/')
	public getHello(): string {
		return this.appService.getHello();
	}

	@Post('/clone')
	public async clone(@Body('url') url: string): Promise<void> {
		this.git.clone(url, randomUUID());
	}
}

