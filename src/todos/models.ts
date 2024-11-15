import { Prisma } from '@prisma/client';

const v = Prisma.validator<Prisma.TodoItemDefaultArgs>();

export const simple = v({});
export type SimpleTodo = Prisma.TodoItemGetPayload<typeof simple>;

export const withColor = v({
	include: {
		typeData: {
			select: {
				color: true
			}
		}
	}
});
export type TodoWithColor = Prisma.TodoItemGetPayload<typeof withColor>;

