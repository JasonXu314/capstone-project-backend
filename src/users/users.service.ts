import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthDataSource } from 'src/auth/auth.module';
import { DBService } from 'src/db/db.service';

@Injectable()
export class UsersService implements AuthDataSource {
	public constructor(private readonly db: DBService) {}

	public async auth(token: string): Promise<User | null> {
		return { id: token, name: token };
	}
}

