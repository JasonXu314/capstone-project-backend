import { DynamicModule } from '@nestjs/common';
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
	const h = Math.round(Math.random() * 150 + 15 + 180);
	const s = 100;
	const l = 50;

	return `${h} ${s} ${l}`;
}

// generate HSL color from cool spectrum, with 15deg padding margin
export function generateTypeColor(): string {
	const h = Math.round(Math.random() * 150 + 15);
	const s = 100;
	const l = 50;

	return `${h} ${s} ${l}`;
}

