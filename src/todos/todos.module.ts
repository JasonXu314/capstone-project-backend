import { Module } from '@nestjs/common';
import { DBModule } from 'src/db/db.module';
import { FSModule } from 'src/fs/fs.module';
import { GHModule } from 'src/gh/gh.module';
import { TodosService } from './todos.service';

@Module({
	imports: [DBModule, GHModule, FSModule],
	controllers: [],
	providers: [TodosService],
	exports: [TodosService]
})
export class TodosModule {}

