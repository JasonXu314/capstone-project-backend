import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { App } from 'octokit';
import { GHFullUser } from './models';

@Injectable()
export class GHService {
	private readonly gh: App;

	public constructor() {
		this.gh = new App({
			appId: process.env.GH_APP_ID!,
			privateKey: readFileSync('pk.pem').toString(),
			oauth: {
				clientId: process.env.GH_CLIENT_ID!,
				clientSecret: process.env.GH_CLIENT_SECRET!
			}
		});
	}

	public async getUser(code: string): Promise<GHFullUser> {
		return this.gh.oauth
			.getUserOctokit({ code })
			.then((kit) =>
				kit.request({
					url: '/user',
					method: 'GET'
				})
			)
			.then((res) => res.data);
	}

	public async getRepos(installation: number) {
		return this.gh
			.getInstallationOctokit(installation)
			.then((kit) => kit.rest.apps.listReposAccessibleToInstallation())
			.then((res) => res.data.repositories);
	}

	public async getToken(installation: number) {
		return this.gh.octokit.rest.apps.createInstallationAccessToken({ installation_id: installation }).then((res) => res.data.token);
	}

	public async relpaceFile(installation: number, owner: string, url: string, path: string, sha: string, content: string) {
		const repo = url.split('/').at(-1)!;

		return this.gh
			.getInstallationOctokit(installation)
			.then((kit) => kit.rest.repos.createOrUpdateFileContents({ owner, repo, path, message: 'Codeban automatic scan', sha, content: btoa(content) }));
	}

	public async getLatestCommit(installation: number, owner: string, url: string) {
		const repo = url.split('/').at(-1)!;

		return this.gh
			.getInstallationOctokit(installation)
			.then((kit) => Promise.all([kit, kit.rest.repos.get({ owner, repo }).then((res) => res.data.default_branch)]))
			.then(([kit, ref]) => kit.rest.repos.getCommit({ owner, repo, ref }))
			.then((res) => res.data);
	}
}

