import { Prisma } from '@prisma/client';

const v = Prisma.validator<Prisma.ProjectDefaultArgs>();

export const simple = v({});
export type SimpleProject = Prisma.ProjectGetPayload<typeof simple>;

export const full = v({
	include: {
		ignoredPaths: true,
		owner: true,
		collaborators: {
			include: {
				user: true
			}
		},
		todoTypes: true
	}
});
export type FullProject = Prisma.ProjectGetPayload<typeof full>;
export type NonNullCollaborator = Omit<Prisma.ProjectGetPayload<typeof full>['collaborators'][0], 'user'> & {
	user: Exclude<Prisma.ProjectGetPayload<typeof full>['collaborators'][0]['user'], null>;
};

