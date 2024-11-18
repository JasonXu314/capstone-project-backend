import { DynamicModule, NotFoundException } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

export function fi<T>(): T {
	return undefined as T;
}

export function serialize(data: any): string | undefined {
	if (typeof data === 'object') {
		if (data === null) {
			return 'null';
		}

		if (data instanceof Date) {
			return `new Date("${data.toISOString()}")`;
		} else if (Array.isArray(data)) {
			let out = '[';
			for (const elem of data) {
				const serialized = serialize(elem);
				if (serialized !== undefined) {
					out += `${serialized},`;
				}
			}
			if (out !== '[') {
				out = out.slice(0, -1);
			}
			out += ']';

			return out;
		} else {
			let out = '{';
			for (const prop in data) {
				const serialized = serialize(data[prop]);
				if (serialized !== undefined) {
					out += `"${prop}":${serialized},`;
				}
			}
			if (out !== '{') {
				out = out.slice(0, -1);
			}
			out += '}';

			return out;
		}
	} else {
		if (data !== undefined) {
			if (typeof data === 'string') {
				return `"${data.replace('"', '\\"').replace('\\', '\\\\')}"`;
			} else if (typeof data === 'boolean' || typeof data === 'number') {
				return data.toString();
			}
		}
	}
}

export function serveClient(): DynamicModule[] {
	return [
		ServeStaticModule.forRoot({
			rootPath: 'dist/client/assets',
			serveRoot: '/__app'
		}),
		ServeStaticModule.forRoot({
			rootPath: 'src/client/public',
			serveRoot: '/'
		})
	];
}

// generate HSL color from warm spectrum, with 15deg padding margin
export function generateUserColor(): string {
	const h = Math.round(Math.random() * 150 + 15 + -90);
	const s = 100;
	const l = 50;

	return `${h} ${s} ${l}`;
}

// generate HSL color from cool spectrum, with 15deg padding margin
export function generateTypeColor(): string {
	const h = Math.round(Math.random() * 150 + 15 + 90);
	const s = 100;
	const l = 50;

	return `${h} ${s} ${l}`;
}

export function extractWhitespace(line: string): string {
	let out = '';

	for (let i = 0; i < line.length; i++) {
		if (/^\w$/.test(line[i])) {
			out += line[i];
		} else {
			return out;
		}
	}

	return out;
}

export function commentPrefix(ext: string): string {
	switch (ext) {
		case 'js':
		case 'ts':
		case 'mjs':
		case 'mts':
		case 'jsx':
		case 'tsx':
		case 'java':
		case 'c':
		case 'cpp':
		case 'cc':
		case 'h':
		case 'hpp':
		case 'prisma':
			return '//';
		case 'py':
		case 'sh':
			return '#';
		case 'asm':
			return ';';
		case 'sql':
			return '--';
		case 'm':
			return '%';
		default:
			throw new NotFoundException(`Unrecognized file extension '${ext}'`);
	}
}

