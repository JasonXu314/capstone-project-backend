import { Module } from '@nestjs/common';
import { DBModule } from 'src/db/db.module';
import { GitModule } from 'src/git/git.module';
import { ProjectsService } from './projects.service';

@Module({
	imports: [DBModule, GitModule],
	controllers: [],
	providers: [ProjectsService],
	exports: [ProjectsService]
})
export class ProjectsModule {}

