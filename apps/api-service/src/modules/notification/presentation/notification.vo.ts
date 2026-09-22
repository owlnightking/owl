import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class NotificationVo {
  @ApiProperty({ description: "消息 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "接收用户 id", nullable: true, example: 1 })
  userId!: number | null;

  @ApiProperty({ description: "消息标题", example: "系统通知" })
  title!: string;

  @ApiProperty({ description: "消息内容", example: "您有一条新的系统通知" })
  content!: string;

  @ApiProperty({ description: "消息类型", example: "system" })
  type!: string;

  @ApiProperty({ description: "发送渠道", example: "in-app" })
  channel!: string;

  @ApiProperty({ description: "消息状态", example: "unread" })
  status!: string;

  @ApiProperty({ description: "发送时间", nullable: true, example: "2026-09-20T10:00:00.000Z" })
  sentAt!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;
}

export class NotificationPageVo extends PageMetaVo {
  @ApiProperty({ description: "消息列表", type: [NotificationVo] })
  list!: NotificationVo[];
}

export class UnreadCountVo {
  @ApiProperty({ description: "未读消息数", example: 3 })
  count!: number;
}
