import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UserGroupService } from "./application/user-group.service";
import { USER_GROUP_REPOSITORY, USER_GROUP_SERVICE } from "./domain/user-group.ports";
import { PrismaUserGroupRepository } from "./infrastructure/prisma-user-group.repository";
import { UserGroupController } from "./presentation/user-group.controller";

@Module({
  imports: [AuthModule],
  controllers: [UserGroupController],
  providers: [
    { provide: USER_GROUP_REPOSITORY, useClass: PrismaUserGroupRepository },
    { provide: USER_GROUP_SERVICE, useClass: UserGroupService },
  ],
  exports: [USER_GROUP_SERVICE, USER_GROUP_REPOSITORY],
})
export class UserGroupModule {}
