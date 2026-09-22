import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class AuditLogUserVo {
  @ApiProperty({ description: "用户姓名", example: "张三" })
  name!: string;

  @ApiProperty({ description: "72 尺寸头像地址", nullable: true })
  avatar72!: string | null;

  @ApiProperty({ description: "240 尺寸头像地址", nullable: true })
  avatar240!: string | null;
}

export class AuditLogVo {
  @ApiProperty({ description: "日志 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "用户 id", example: 1, nullable: true })
  userId!: number | null;

  @ApiProperty({ description: "飞书 unionId", nullable: true })
  unionId!: string | null;

  @ApiProperty({ description: "操作动作", example: "update" })
  action!: string;

  @ApiProperty({ description: "资源标识", example: "user" })
  resource!: string;

  @ApiProperty({ description: "资源 id", nullable: true })
  resourceId!: string | null;

  @ApiProperty({ description: "操作详情", nullable: true })
  detail!: unknown;

  @ApiProperty({ description: "客户端 IP", nullable: true })
  ip!: string | null;

  @ApiProperty({ description: "IP 归属地", nullable: true })
  ipRegion!: string | null;

  @ApiProperty({ description: "请求 id", nullable: true })
  requestId!: string | null;

  @ApiProperty({ description: "操作结果（success / failed）", example: "success" })
  result!: string;

  @ApiProperty({ description: "所属系统", nullable: true })
  system!: string | null;

  @ApiProperty({ description: "所属模块", nullable: true })
  module!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ description: "操作用户", type: AuditLogUserVo, nullable: true })
  user!: AuditLogUserVo | null;
}

export class AuditLogPageVo extends PageMetaVo {
  @ApiProperty({ description: "审计日志列表", type: [AuditLogVo] })
  list!: AuditLogVo[];
}
