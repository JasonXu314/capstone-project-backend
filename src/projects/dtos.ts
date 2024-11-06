import { IsString, IsUrl } from 'class-validator';
import { fi } from 'src/utils/utils';

export class CreateProjectDTO {
	@IsString()
	name: string = fi();

	@IsUrl({ protocols: ['https'], host_whitelist: ['github.com'] })
	url: string = fi();
}

