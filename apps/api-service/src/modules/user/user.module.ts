import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UserService, USER_SERVICE } from "./application/user.service";
import { USER_REPOSITORY } from "./domain/user.ports";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { UserController } from "./presentation/user.controller";

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: USER_SERVICE, useClass: UserService },
  ],
  exports: [USER_SERVICE, USER_REPOSITORY],
})
export class UserModule {}
