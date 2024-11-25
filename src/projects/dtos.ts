import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';
import { fi } from 'src/utils/utils';

export class CreateProjectDTO {
	@IsString()
	@ApiProperty()
	name: string = fi();

	@IsUrl({ protocols: ['https'], host_whitelist: ['github.com'] })
	@ApiProperty()
	url: string = fi();
}

export class AddTypeDTO {
	@IsString()
	@ApiProperty()
	name: string = fi();
}

