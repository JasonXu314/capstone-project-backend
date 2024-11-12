import { Injectable } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import type { Prisma, TodoItem } from '@prisma/client';
import { DBService } from 'src/db/db.service';
import { FSService } from 'src/fs/fs.service';
import { GHService } from 'src/gh/gh.service';

@Injectable()
export class TodosService {
	private readonly cuid: () => string;

	public constructor(private readonly db: DBService, private readonly gh: GHService, private readonly fs: FSService) {
		this.cuid = init({ length: 8 });
	}

	public async getAll(where: Prisma.TodoItemWhereInput): Promise<TodoItem[]> {
		return this.db.todoItem.findMany({ where });
	}
}

