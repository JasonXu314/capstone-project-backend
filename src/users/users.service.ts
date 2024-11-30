import { Injectable } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import type { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuthDataSource } from 'src/auth/auth.module';
import { DBService } from 'src/db/db.service';
import { GHFullUser } from 'src/gh/models';
import { generateUserColor } from 'src/utils/utils';

@Injectable()
export class UsersService implements AuthDataSource {
	private readonly cuid: () => string;

	public constructor(private readonly db: DBService) {
		this.cuid = init({ length: 16 });
	}

	public async getAll(): Promise<User[]> {
		return this.db.user.findMany();
	}

	public async auth(token: string): Promise<User | null> {
		return this.db.user.findUnique({ where: { token } });
	}

	public async register(installation_id: number, ghUser: GHFullUser): Promise<User> {
		const id = this.cuid();

		const existing = await this.db.gHUserRef.findUnique({ where: { id: ghUser.id } });

		if (existing) {
			await this.db.gHUserRef.update({ where: { id: ghUser.id }, data: { userId: id } });
			return this.db.user.create({
				data: {
					id,
					github_id: ghUser.id,
					installation_id,
					name: ghUser.login,
					color: generateUserColor(),
					token: this.generateToken()
				}
			});
		} else {
			return this.db.user.create({
				data: {
					installation_id,
					name: ghUser.login,
					color: generateUserColor(),
					token: this.generateToken(),
					ghRef: {
						create: {
							id: ghUser.id,
							userId: this.cuid(),
							avatar: ghUser.avatar_url
						}
					}
				}
			});
		}
	}

	public async login(ghUser: GHFullUser): Promise<User | null> {
		return this.db.user.findUnique({ where: { github_id: ghUser.id } });
	}

	public generateToken(): string {
		return randomBytes(32).toString('hex');
	}
}

