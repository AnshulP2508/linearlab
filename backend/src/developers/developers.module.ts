import { Module } from '@nestjs/common';
import { MongoModule } from '../mongo/mongo.module';
import { UsersModule } from '../users/users.module';
import { DeveloperWorkspaceController } from './developer-workspace.controller';
import { DeveloperWorkspaceService } from './developer-workspace.service';
import { DevelopersController } from './developers.controller';

@Module({
  imports: [UsersModule, MongoModule],
  controllers: [DevelopersController, DeveloperWorkspaceController],
  providers: [DeveloperWorkspaceService],
})
export class DevelopersModule {}
