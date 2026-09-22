import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class SystemLogVo {
  @ApiProperty({ description: "日志 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "来源服务", nullable: true, example: "api-service" })
  service!: string | null;

  @ApiProperty({ description: "级别（error / warn）", example: "error" })
  level!: string;

  @ApiProperty({ description: "错误信息" })
  message!: string;

  @ApiProperty({ description: "错误堆栈", nullable: true })
  stack!: string | null;

  @ApiProperty({ description: "请求 id", nullable: true })
  requestId!: string | null;

  @ApiProperty({ description: "HTTP 方法", nullable: true, example: "GET" })
  method!: string | null;

  @ApiProperty({ description: "请求地址", nullable: true, example: "/api/roles" })
  url!: string | null;

  @ApiProperty({ description: "HTTP 状态码", nullable: true, example: 404 })
  status!: number | null;

  @ApiProperty({ description: "业务错误码", nullable: true, example: 40400 })
  code!: number | null;

  @ApiProperty({ description: "用户 id", nullable: true })
  userId!: number | null;

  @ApiProperty({ description: "发生时间" })
  createdAt!: Date;
}

export class SystemLogPageVo extends PageMetaVo {
  @ApiProperty({ description: "系统日志列表", type: [SystemLogVo] })
  list!: SystemLogVo[];
}
