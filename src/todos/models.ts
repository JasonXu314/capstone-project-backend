import { Prisma } from '@prisma/client';

const v = Prisma.validator<Prisma.TodoItemDefaultArgs>();

export const simple = v({});
export type SimpleTodo = Prisma.TodoItemGetPayload<typeof simple>;

export const withColor = v({
	include: {
		assignments: {
			include: {
				user: {
					select: {
						id: true,
						color: true,
						name: true
					}
				}
			}
		}
	}
});
export type RawTodoWithColor = Prisma.TodoItemGetPayload<typeof withColor>;
export type TodoWithColor = Omit<RawTodoWithColor, 'assignments'> & { assignees: RawTodoWithColor['assignments'][0]['user'][] };

