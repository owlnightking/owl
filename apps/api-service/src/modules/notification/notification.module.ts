import { Module } from "@nestjs/common";
import { NotificationService } from "./application/notification.service";
import { NotificationController } from "./presentation/notification.controller";
import { PrismaNotificationRepository } from "./infrastructure/prisma-notification.repository";
import { NOTIFICATION_REPOSITORY, NOTIFICATION_SERVICE } from "./domain/notification.ports";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    { provide: NOTIFICATION_SERVICE, useClass: NotificationService },
  ],
  exports: [NOTIFICATION_SERVICE],
})
export class NotificationModule {}
