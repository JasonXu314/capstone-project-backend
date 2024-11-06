import { Injectable } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import { Project, User } from '@prisma/client';
import { rmSync } from 'fs';
import { DBService } from 'src/db/db.service';
import { GitService } from 'src/git/git.service';
import { CreateProjectDTO } from './dtos';

@Injectable()
export class ProjectsService {
	private readonly cuid: () => string;

	public constructor(private readonly db: DBService, private readonly git: GitService) {
		this.cuid = init({ length: 16 });
	}

	public async createProject(user: User, { name, url }: CreateProjectDTO): Promise<Project> {
		const id = this.cuid();

		const project = await this.db.project.create({
			data: {
				id,
				owner: { connect: { id: user.id } },
				name,
				url
			}
		});

		await this.git.clone(url, id);

		return project;
	}

	public async syncProject(url: string): Promise<void> {
		const project = await this.db.project.findUnique({ where: { url }, select: { id: true } });

		if (project === null) {
			throw new Error('Nonexistent project');
		} else {
			return this.git.pull(project.id);
		}
	}

	public async deleteProject(id: string): Promise<void> {
		await this.db.project.delete({ where: { id } });
		rmSync(`repos/${id}`, { recursive: true, force: true });
	}
}

