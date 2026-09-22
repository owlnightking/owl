import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { resolve } from "node:path";
import { DatabaseModule } from "./database.module";
import { HealthController } from "./health.controller";
import { ApiExceptionFilter } from "./common/response/api-exception.filter";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { RoleModule } from "./modules/role/role.module";
import { PermissionModule } from "./modules/permission/permission.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { FileModule } from "./modules/file/file.module";
import { SystemConfigModule } from "./modules/system-config/system-config.module";
import { FieldConfigModule } from "./modules/field-config/field-config.module";
import { McpModule } from "./modules/mcp/mcp.module";
import { ProjectModule } from "./modules/project/project.module";
import { RecognitionModule } from "./modules/recognition/recognition.module";
import { MdDocModule } from "./modules/md-doc/md-doc.module";
import { SystemLogModule } from "./modules/system-log/system-log.module";

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(__dirname, "../../../.env"), ".env"],
    }),
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AuditLogModule,
    NotificationModule,
    FileModule,
    SystemConfigModule,
    FieldConfigModule,
    McpModule,
    ProjectModule,
    RecognitionModule,
    MdDocModule,
    SystemLogModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class AppModule {}
