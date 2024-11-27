import { Prisma } from '@prisma/client';

const v = Prisma.validator<Prisma.ProjectDefaultArgs>();

export const simple = v({});
export type SimpleProject = Prisma.ProjectGetPayload<typeof simple>;

export const full = v({
	include: {
		ignoredPaths: true,
		owner: true,
		collaborators: true,
		todoTypes: true
	}
});
export type FullProject = Prisma.ProjectGetPayload<typeof full>;
