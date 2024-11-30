import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { fi } from 'src/utils/utils';

export class NewTodoDTO {
	@IsString()
	@ApiProperty()
	file: string = fi();

	@IsInt()
	@ApiProperty()
	ln: number = fi();

	@IsString()
	@ApiProperty()
	message: string = fi();

	@IsString()
	@ApiProperty()
	type: string = fi();
}

export class EditTodoDTO {
	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	message?: string = fi();

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	type?: string = fi();
}

export class SetAssigneesDTO {
	@IsString({ each: true })
	@ApiProperty()
	assigneeIds: string[] = fi();
}

