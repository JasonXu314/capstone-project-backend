import { Module } from '@nestjs/common';
import { DBModule } from 'src/db/db.module';
import { GitModule } from 'src/git/git.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
	imports: [DBModule, GitModule],
	controllers: [ProjectsController],
	providers: [ProjectsService],
	exports: [ProjectsService]
})
export class ProjectsModule {}

