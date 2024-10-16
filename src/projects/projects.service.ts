import { Injectable } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import { Project } from '@prisma/client';
import { rmdirSync } from 'fs';
import { DBService } from 'src/db/db.service';
import { GitService } from 'src/git/git.service';

@Injectable()
export class ProjectsService {
	private readonly cuid: () => string;

	public constructor(private readonly db: DBService, private readonly git: GitService) {
		this.cuid = init({ length: 16 });
	}

	public async createProject(name: string, url: string): Promise<Project> {
		const id = this.cuid();

		const project = await this.db.project.create({
			data: {
				id,
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
		rmdirSync(`repos/${id}`, { recursive: true });
	}
}

