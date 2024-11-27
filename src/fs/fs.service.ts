import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { FSNode, type FSTree } from './fs.model';

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

	public tree(path: string, filter: (path: string) => boolean = () => true, root = path): FSTree {
		if (statSync(path).isDirectory()) {
			return {
				name: path.split('/').at(-1)!,
				metadata: { pathname: path.replace(`${root}/`, '') },
				children: readdirSync(path).flatMap<FSNode>((elem) => {
					if (filter(`${path}/${elem}`)) {
						if (statSync(`${path}/${elem}`).isDirectory()) {
							return [this.tree(`${path}/${elem}`, filter, root)];
						} else {
							return [
								{
									name: elem,
									metadata: { pathname: `${path}/${elem}`.replace(`${root}/`, '') }
								}
							];
						}
					} else {
						return [];
					}
				})
			};
		} else {
			return {
				name: path.split('/').at(-1)!,
				metadata: { pathname: path.replace(`${root}/`, '') }
			};
		}
	}
}

