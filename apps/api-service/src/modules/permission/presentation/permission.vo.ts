import { ApiProperty } from "@nestjs/swagger";

export class PermissionVo {
  @ApiProperty({ description: "权限 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "权限编码", example: "system:permission:read" })
  code!: string;

  @ApiProperty({ description: "权限名称", example: "查看权限" })
  name!: string;

  @ApiProperty({ description: "资源", example: "permission" })
  resource!: string;

  @ApiProperty({ description: "操作", example: "read" })
  action!: string;

  @ApiProperty({ description: "权限描述", nullable: true })
  description!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;
}
