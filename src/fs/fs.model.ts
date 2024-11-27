export type FSNode = {
	name: string;
	children?: FSNode[];
	metadata: {
		pathname: string;
	};
};

export type FSTree = FSNode;
