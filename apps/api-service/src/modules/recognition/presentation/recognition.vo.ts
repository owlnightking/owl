import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class RecognitionVo {
  @ApiProperty({ description: "认可 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "发送人 id", example: 1 })
  senderId!: number;

  @ApiProperty({ description: "发送人姓名", required: false })
  senderName?: string;

  @ApiProperty({ description: "发送人头像地址", required: false })
  senderAvatar?: string;

  @ApiProperty({ description: "接收人 id", example: 2 })
  receiverId!: number;

  @ApiProperty({ description: "接收人姓名", required: false })
  receiverName?: string;

  @ApiProperty({ description: "接收人头像地址", required: false })
  receiverAvatar?: string;

  @ApiProperty({ description: "关联徽章 id", nullable: true })
  badgeId!: number | null;

  @ApiProperty({ description: "徽章名称", required: false })
  badgeName?: string;

  @ApiProperty({ description: "徽章图标", required: false })
  badgeIcon?: string;

  @ApiProperty({ description: "认可内容", example: "感谢你在项目中的大力支持！" })
  message!: string;

  @ApiProperty({ description: "认可状态", enum: ["pending", "approved", "rejected"], example: "pending" })
  status!: "pending" | "approved" | "rejected";

  @ApiProperty({ description: "是否置顶", example: false })
  pinned!: boolean;

  @ApiProperty({ description: "审批人 id", nullable: true })
  approverId!: number | null;

  @ApiProperty({ description: "审批时间", nullable: true, example: "2026-09-20T10:00:00.000Z" })
  approvedAt!: string | null;

  @ApiProperty({ description: "驳回原因", nullable: true })
  rejectReason!: string | null;

  @ApiProperty({ description: "点赞数", example: 10 })
  likeCount!: number;

  @ApiProperty({ description: "当前用户是否已点赞", required: false })
  likedByMe?: boolean;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;
}

export class RecognitionPageVo extends PageMetaVo {
  @ApiProperty({ description: "列表", type: [RecognitionVo] })
  list!: RecognitionVo[];
}

export class RecognitionPendingCountVo {
  @ApiProperty({ description: "待审批数量", example: 3 })
  count!: number;
}

export class ToggleLikeVo {
  @ApiProperty({ description: "点赞后的状态", example: true })
  liked!: boolean;
}

export class RecognitionLevelVo {
  @ApiProperty({ description: "等级", example: 3 })
  level!: number;

  @ApiProperty({ description: "当前经验值", example: 1500 })
  exp!: number;

  @ApiProperty({ description: "升级所需经验值", example: 3000 })
  nextLevelExp!: number;
}
