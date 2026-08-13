import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { RoleModule } from "./modules/role/role.module";
import { PermissionModule } from "./modules/permission/permission.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { FileModule } from "./modules/file/file.module";
import { SystemConfigModule } from "./modules/system-config/system-config.module";
import { McpModule } from "./modules/mcp/mcp.module";
import { ProjectModule } from "./modules/project/project.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AuditLogModule,
    NotificationModule,
    FileModule,
    SystemConfigModule,
    McpModule,
    ProjectModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
