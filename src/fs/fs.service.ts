import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';

@Injectable()
export class FSService {
	public ensureDir(path: string): void {
		if (!existsSync(path)) {
			mkdirSync(path, { recursive: true });
		}
	}

	public *traverse(path: string, filter: (path: string) => boolean = () => true): Generator<string, void, undefined> {
		if (statSync(path).isDirectory()) {
			const contents = readdirSync(path);

			for (const elem of contents) {
				if (filter(`${path}/${elem}`)) {
					if (statSync(`${path}/${elem}`).isDirectory()) {
						yield* this.traverse(`${path}/${elem}`, filter);
					} else {
						yield `${path}/${elem}`;
					}
				}
			}
		} else {
			if (filter(path)) {
				yield path;
			}
		}

		return;
	}
}

