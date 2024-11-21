import { forwardRef, Module } from '@nestjs/common';
import { DBModule } from 'src/db/db.module';
import { FSModule } from 'src/fs/fs.module';
import { GHModule } from 'src/gh/gh.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
	imports: [DBModule, GHModule, FSModule, forwardRef(() => ProjectsModule)],
	controllers: [TodosController],
	providers: [TodosService],
	exports: [TodosService]
})
export class TodosModule {}

