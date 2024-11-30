import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { type User as UserT } from '@prisma/client';
import { Protected } from 'src/auth/protected.decorator';
import { ProjectsService } from 'src/projects/projects.service';
import { User } from 'src/utils/decorators/user.decorator';
import { EditTodoDTO, NewTodoDTO, SetAssigneesDTO } from './dtos';
import { TodoWithColor } from './models';
import { TodosService } from './todos.service';

@Controller('/projects/:projectId/todos')
export class TodosController {
	public constructor(private readonly service: TodosService, private readonly projects: ProjectsService) {}

	@Protected()
	@Get('/')
	public async getTodos(@User() user: UserT, @Param('projectId') projectId: string): Promise<TodoWithColor[]> {
		const project = await this.projects.getFull({ id: projectId });

		if (!project || !project.collaborators.some(({ userId }) => userId === user.id)) {
			throw new NotFoundException('Project does not exist');
		}

		return this.service.getAllWithColor({ projectId });
	}

	@Protected()
	@Post('/new')
	public async newTodo(@User() user: UserT, @Param('projectId') projectId: string, @Body() data: NewTodoDTO): Promise<TodoWithColor[]> {
		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.createTodo(project, user, data);

		return this.service.getAllWithColor({ projectId });
	}

	@Protected()
	@Delete('/:id')
	public async deleteTodo(@User() user: UserT, @Param('projectId') projectId: string, @Param('id') id: string): Promise<TodoWithColor[]> {
		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.deleteTodo(project, user, id);

		return this.service.getAllWithColor({ projectId });
	}

	@Protected()
	@Post('/:id/complete')
	public async completeTodo(@User() user: UserT, @Param('projectId') projectId: string, @Param('id') id: string): Promise<TodoWithColor[]> {
		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.completeTodo(project, user, id);

		return this.service.getAllWithColor({ projectId });
	}

	@Protected()
	@Post('/:id/uncomplete')
	public async uncompleteTodo(@User() user: UserT, @Param('projectId') projectId: string, @Param('id') id: string): Promise<TodoWithColor[]> {
		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.uncompleteTodo(project, user, id);

		return this.service.getAllWithColor({ projectId });
	}

	@Protected()
	@Post('/:id/edit')
	public async editTodo(
		@User() user: UserT,
		@Param('projectId') projectId: string,
		@Param('id') id: string,
		@Body() data: EditTodoDTO
	): Promise<TodoWithColor[]> {
		if (!('message' in data || 'type' in data)) {
			throw new BadRequestException("Need either 'message' or 'type'");
		}

		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.editTodo(project, user, id, data);

		return this.service.getAllWithColor({ projectId });
	}

	@Protected()
	@Put('/:id/assignees')
	public async setAssignees(
		@User() user: UserT,
		@Param('projectId') projectId: string,
		@Param('id') id: string,
		@Body() data: SetAssigneesDTO
	): Promise<Pick<UserT, 'id' | 'name'| 'color'>[]> {
		const project = await this.projects.getFull({ id: projectId, collaborators: { some: { userId: user.id } } });

		if (!project) {
			throw new NotFoundException('Project does not exist');
		}

		await this.service.setAssignees(project, id, data);

		return this.service.getWithColor({ id_projectId: { id, projectId } }).then((todo) => todo!.assignees);
	}
}

