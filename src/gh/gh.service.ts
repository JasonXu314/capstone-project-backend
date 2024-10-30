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
}

