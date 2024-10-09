import { Module } from '@nestjs/common';
import { GHService } from './gh.service';

@Module({
	imports: [],
	controllers: [],
	providers: [GHService],
	exports: [GHService]
})
export class GHModule {}

