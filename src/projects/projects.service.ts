import { Injectable } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import { DBService } from 'src/db/db.service';
import { GitService } from 'src/git/git.service';

@Injectable()
export class ProjectsService {
	private readonly cuid: () => string;

	public constructor(private readonly db: DBService, private readonly git: GitService) {
		this.cuid = init({ length: 16 });
	}
}

