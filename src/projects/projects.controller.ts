import { Body, Controller, Post } from '@nestjs/common';
import { Project, User as UserT } from '@prisma/client';
import { Protected } from 'src/auth/protected.decorator';
import { User } from 'src/utils/decorators/user.decorator';
import { CreateProjectDTO } from './dtos';
import { ProjectsService } from './projects.service';

@Controller('/projects')
export class ProjectsController {
	public constructor(private readonly service: ProjectsService) {}

	@Protected()
	@Post('/new')
	public async clone(@User() user: UserT, @Body() data: CreateProjectDTO): Promise<Project> {
		return this.service.createProject(user, data);
	}
}

