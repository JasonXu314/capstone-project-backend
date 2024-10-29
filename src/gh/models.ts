// NOTE: these are using interfaces because these are types we don't control, and thus don't want to validate
export interface PushRecord {
	action: 'push';
	ref: string;
	before: string;
	after: string;
	repository: RepoRecord;
	pusher: GitUserRecord;
	sender: GHUserRecord;
	installation: InstallationRecord;
	created: boolean;
	deleted: boolean;
	forced: boolean;
	base_ref: string | null;
	compare: string; // url
	commits: CommitRecord[];
	head_commit: CommitRecord;
}

export interface RemovedRecord {
	action: 'removed';
}

export interface RepoRecord {
	id: number;
	node_id: string;
	name: string;
	full_name: string;
	private: boolean;
	owner: GHUserRecord;
	html_url: string;
	description: string | null;
	fork: boolean;
	url: string;
	forks_url: string;
	keys_url: string;
	collaborators_url: string;
	teams_url: string;
	hooks_url: string;
	issue_events_url: string;
	events_url: string;
	assignees_url: string;
	branches_url: string;
	tags_url: string;
	blobs_url: string;
	git_tags_url: string;
	git_refs_url: string;
	trees_url: string;
	statuses_url: string;
	languages_url: string;
	stargazers_url: string;
	contributors_url: string;
	subscribers_url: string;
	subscription_url: string;
	commits_url: string;
	git_commits_url: string;
	comments_url: string;
	issue_comment_url: string;
	contents_url: string;
	compare_url: string;
	merges_url: string;
	archive_url: string;
	downloads_url: string;
	issues_url: string;
	pulls_url: string;
	milestones_url: string;
	notifications_url: string;
	labels_url: string;
	releases_url: string;
	deployments_url: string;
	created_at: number;
	updated_at: string;
	pushed_at: number;
	git_url: string; // git://
	ssh_url: string;
	clone_url: string;
	svn_url: string;
	homepage: string | null;
	size: number;
	stargazers_count: number;
	watchers_count: number;
	language: string | null;
	has_issues: boolean;
	has_projects: boolean;
	has_downloads: boolean;
	has_wiki: boolean;
	has_pages: boolean;
	has_discussions: boolean;
	forks_count: number;
	mirror_url: string | null; // TODO: verify
	archived: boolean;
	disabled: boolean;
	open_issues_count: number;
	license: string | null; // TODO: verify
	allow_forking: boolean;
	is_template: boolean;
	web_commit_signoff_required: boolean;
	topics: string[]; // TODO: verify
	visibility: 'public' | 'private';
	forks: number;
	open_issues: number;
	watchers: number;
	default_branch: string;
	stargazers: number;
	master_branch: string;
}

export interface GHUserRecord {
	name: string;
	email: string;
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: 'User';
	site_admin: boolean;
}

export interface GitUserRecord {
	name: string;
	email: string;
}

export interface InstallationRecord {
	id: number;
	node_id: string;
}

export interface FullInstallationRecord {
	id: number;
	client_id: string;
	account: GHUserRecord;
	repository_selection: 'selected';
	access_tokens_url: string;
	repositories_url: string;
	html_url: string;
	app_id: number;
	app_slug: string;
	target_id: number;
	target_type: string;
	permissions: {
		contents: 'write';
		metadata: 'read';
	};
	events: ['push'];
	created_at: string; // ISO datetime
	updated_at: string; // ISO datetime
	single_file_name: string | null;
	has_multiple_single_files: boolean;
	single_file_paths: string[];
	suspended_by: string | null;
	suspended_at: string | null;
}

export interface CommitRecord {
	id: string;
	tree_id: string;
	distinct: boolean;
	message: string;
	timestamp: string;
	url: string;
	author: CommitUserRecord;
	committer: CommitUserRecord;
	added: string[];
	removed: string[];
	modified: string[];
}

export interface CommitUserRecord {
	name: string;
	email: string;
	username: string;
}

export interface PostInstallRecord {
	code: string;
	installation_id: string;
	setup_action: 'install';
}

export interface PostAuthRecord {
	code: string;
}

export interface GHFullUser {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: 'User';
	user_view_type: string;
	site_admin: boolean;
	name: string;
	company: null;
	blog: string;
	location: string | null;
	email: string | null;
	hireable: string | null;
	bio: string | null;
	twitter_username: string | null;
	notification_email: string | null;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string; // ISO datetime
	updated_at: string; // ISO datetime
}

