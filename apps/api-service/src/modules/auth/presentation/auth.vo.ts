import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AuthUserVo {
  @ApiProperty({ description: "飞书 unionId" })
  unionId!: string;

  @ApiProperty({ description: "飞书 openId" })
  openId!: string;

  @ApiProperty({ description: "姓名", example: "张三" })
  name!: string;

  @ApiPropertyOptional({ description: "头像地址", nullable: true })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: "邮箱", nullable: true })
  email?: string;

  @ApiProperty({ description: "主体类型", enum: ["employee", "contractor", "service_account"], example: "employee" })
  principalType!: string;
}

export class LoginVo {
  @ApiProperty({ description: "访问令牌" })
  accessToken!: string;

  @ApiProperty({ description: "刷新令牌" })
  refreshToken!: string;

  @ApiProperty({ description: "用户信息", type: AuthUserVo })
  user!: AuthUserVo;

  @ApiProperty({ description: "访问令牌有效期（秒）", example: 7200 })
  expiresIn!: number;
}

export class TokenVo {
  @ApiProperty({ description: "访问令牌有效期（秒）", example: 7200 })
  expiresIn!: number;
}

export class MeVo {
  @ApiProperty({ description: "用户 id", example: "1" })
  sub!: string;

  @ApiProperty({ description: "姓名", example: "张三" })
  name!: string;

  @ApiProperty({ description: "飞书 unionId" })
  unionId!: string;

  @ApiProperty({ description: "头像地址", nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: "客户端标识", example: "owl-web" })
  client!: string;

  @ApiProperty({ description: "权限编码列表", type: [String], example: ["user:read"] })
  permissions!: string[];
}

export class MockUserVo {
  @ApiProperty({ description: "用户 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "飞书 unionId" })
  unionId!: string;

  @ApiProperty({ description: "姓名", example: "张三" })
  name!: string;

  @ApiProperty({ description: "头像地址", nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: "状态（active / disabled）", example: "active" })
  status!: string;
}
