import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './auth/auth.middleware';
import { AuthModule, DATA_SOURCE, PREFIX } from './auth/auth.module';
import { DBModule } from './db/db.module';
import { GitModule } from './git/git.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';
import { serveClient } from './utils/utils';

@Module({
	imports: [DBModule, GitModule, UsersModule, ProjectsModule, AuthModule.register({ prefix: 'placeholder' }), ...serveClient()],
	controllers: [AppController],
	providers: [AppService, { provide: DATA_SOURCE, useClass: UsersService }, { provide: PREFIX, useValue: 'placeholder' }]
})
export class AppModule implements NestModule {
	public configure(consumer: MiddlewareConsumer): void {
		consumer.apply(AuthMiddleware).forRoutes('*');
	}
}

