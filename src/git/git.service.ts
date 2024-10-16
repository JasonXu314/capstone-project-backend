import { Injectable } from '@nestjs/common';
import { simpleGit, SimpleGit } from 'simple-git';
import { FSService } from 'src/fs/fs.service';

@Injectable()
export class GitService {
	public constructor(private readonly fs: FSService) {
		fs.ensureDir('repos');
	}

	private git(path: string): SimpleGit {
		return simpleGit(`repos/${path}`);
	}

	public async clone(url: string, to: string): Promise<void> {
		// NOTE: don't use helper git function because this needs to have base dir as <cwd>/repos
		const git = simpleGit('repos');

		await git.clone(url, to);
	}

	public async pull(path: string): Promise<void> {
		const git = this.git(path);

		await git.pull();
	}
}

