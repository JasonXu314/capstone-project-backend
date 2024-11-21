import { IsInt, IsOptional, IsString } from 'class-validator';
import { fi } from 'src/utils/utils';

export class NewTodoDTO {
	@IsString()
	file: string = fi();

	@IsInt()
	ln: number = fi();

	@IsString()
	message: string = fi();

	@IsString()
	type: string = fi();
}

export class EditTodoDTO {
	@IsString()
	@IsOptional()
	message?: string = fi();

	@IsString()
	@IsOptional()
	type?: string = fi();
}

