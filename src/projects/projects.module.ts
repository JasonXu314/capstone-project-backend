import { Module } from '@nestjs/common';
import { DBModule } from 'src/db/db.module';
import { GHModule } from 'src/gh/gh.module';
import { GitModule } from 'src/git/git.module';
import { TodosModule } from 'src/todos/todos.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
	imports: [DBModule, GitModule, TodosModule, GHModule],
	controllers: [ProjectsController],
	providers: [ProjectsService],
	exports: [ProjectsService]
})
export class ProjectsModule {}

