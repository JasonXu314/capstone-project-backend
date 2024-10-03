import { Module } from '@nestjs/common';
import { FSModule } from 'src/fs/fs.module';
import { GitService } from './git.service';

@Module({
	imports: [FSModule],
	controllers: [],
	providers: [GitService],
	exports: [GitService]
})
export class GitModule {}

