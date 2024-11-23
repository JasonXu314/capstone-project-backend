import { CanActivate, ExecutionContext, Inject, Injectable, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PREFIX } from './auth.module';
import { Protected } from './protected.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(@Inject(forwardRef(() => PREFIX)) private readonly prefix: string, private readonly reflector: Reflector) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const metadata = this.reflector.get(Protected, context.getHandler());

		if (metadata) {
			const req = context.switchToHttp().getRequest<Request>();
			const user = req.user;

			return user !== null;
		} else {
			return true;
		}
	}
}

