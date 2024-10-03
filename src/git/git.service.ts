import { Injectable } from '@nestjs/common';
import { FSService } from 'src/fs/fs.service';

@Injectable()
export class GitService {
	public constructor(private readonly fs: FSService) {
		fs.ensureDir('repos');
	}
}

