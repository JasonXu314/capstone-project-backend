import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { type User as UserT } from '@prisma/client';
import { Protected } from 'src/auth/protected.decorator';
import { ProjectsService } from 'src/projects/projects.service';
import { User } from 'src/utils/decorators/user.decorator';
import { EditTodoDTO, NewTodoDTO } from './dtos';
import { type SimpleTodo } from './models';
import { TodosService } from './todos.service';

@Controller('/projects/:projectId/todos')
export class TodosController {
	public constructor(private readonly service: TodosService, private readonly projects: ProjectsService) {}

	@Protected()
	@Get('/')
	public async getTodos(@User() user: UserT, @Param('projectId') projectId: string): Promise<SimpleTodo[]> {
		const project = await this.projects.getFull({ id: projectId });

		if (!project || !project.collaborators.some(({ id }) => id === user.id)) {
			throw new NotFoundException('Project does not exist');
		}

		return this.service.getAll({ projectId });
	}

	@Protected()
	@Post('/new')
	public async newTodo(@User() user: UserT, @Param('projectId') projectId: string, @Body() data: NewTodoDTO): Promise<SimpleTodo[]> {
		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.createTodo(project, user, data);

		return this.service.getAll({ projectId });
	}

	@Protected()
	@Delete('/:id')
	public async deleteTodo(@User() user: UserT, @Param('projectId') projectId: string, @Param('id') id: string): Promise<SimpleTodo[]> {
		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.deleteTodo(project, user, id);

		return this.service.getAll({ projectId });
	}

	@Protected()
	@Post('/:id/complete')
	public async completeTodo(@User() user: UserT, @Param('projectId') projectId: string, @Param('id') id: string): Promise<SimpleTodo[]> {
		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.completeTodo(project, user, id);

		return this.service.getAll({ projectId });
	}

	@Protected()
	@Post('/:id/edit')
	public async editTodo(
		@User() user: UserT,
		@Param('projectId') projectId: string,
		@Param('id') id: string,
		@Body() data: EditTodoDTO
	): Promise<SimpleTodo[]> {
		if (!('message' in data || 'type' in data)) {
			throw new BadRequestException("Need either 'message' or 'type'");
		}

		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { id: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.editTodo(project, user, id, data);

		return this.service.getAll({ projectId });
	}
}

