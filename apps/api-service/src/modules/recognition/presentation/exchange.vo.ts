import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class ExchangeOrderVo {
  @ApiProperty({ description: "订单 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "兑换用户 id", example: 1 })
  userId!: number;

  @ApiProperty({ description: "兑换用户姓名", required: false })
  userName?: string;

  @ApiProperty({ description: "商品 id", example: 1 })
  productId!: number;

  @ApiProperty({ description: "商品名称", required: false })
  productName?: string;

  @ApiProperty({ description: "商品图片地址", required: false })
  productImage?: string;

  @ApiProperty({ description: "兑换数量", example: 1 })
  quantity!: number;

  @ApiProperty({ description: "消耗金币总数", example: 200 })
  totalCost!: number;

  @ApiProperty({ description: "订单状态", enum: ["pending", "approved", "rejected", "fulfilled"], example: "pending" })
  status!: "pending" | "approved" | "rejected" | "fulfilled";

  @ApiProperty({ description: "审批人 id", nullable: true })
  approverId!: number | null;

  @ApiProperty({ description: "审批时间", nullable: true, example: "2026-09-20T10:00:00.000Z" })
  approvedAt!: string | null;

  @ApiProperty({ description: "驳回原因", nullable: true })
  rejectReason!: string | null;

  @ApiProperty({ description: "核销时间", nullable: true, example: "2026-09-20T10:00:00.000Z" })
  fulfilledAt!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;
}

export class ExchangeOrderPageVo extends PageMetaVo {
  @ApiProperty({ description: "列表", type: [ExchangeOrderVo] })
  list!: ExchangeOrderVo[];
}

export class ExchangePendingCountVo {
  @ApiProperty({ description: "待审批数量", example: 3 })
  count!: number;
}

export class CoinAccountVo {
  @ApiProperty({ description: "账户 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "用户 id", example: 1 })
  userId!: number;

  @ApiProperty({ description: "当前金币余额", example: 500 })
  balance!: number;

  @ApiProperty({ description: "累计获得金币", example: 1000 })
  totalEarned!: number;

  @ApiProperty({ description: "累计消耗金币", example: 500 })
  totalSpent!: number;
}

export class CoinTransactionVo {
  @ApiProperty({ description: "流水 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "流水类型", enum: ["earn", "spend", "adjust"], example: "earn" })
  type!: "earn" | "spend" | "adjust";

  @ApiProperty({ description: "变动金额", example: 100 })
  amount!: number;

  @ApiProperty({ description: "变动后余额", example: 500 })
  balance!: number;

  @ApiProperty({ description: "来源", example: "recognition" })
  source!: string;

  @ApiProperty({ description: "关联业务 id", nullable: true })
  referenceId!: string | null;

  @ApiProperty({ description: "备注", nullable: true })
  remark!: string | null;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: Date;
}

export class CoinTransactionPageVo extends PageMetaVo {
  @ApiProperty({ description: "列表", type: [CoinTransactionVo] })
  list!: CoinTransactionVo[];
}

export class StaminaAccountVo {
  @ApiProperty({ description: "用户 id", example: 1 })
  userId!: number;

  @ApiProperty({ description: "当前体力值", example: 5 })
  current!: number;

  @ApiProperty({ description: "体力上限", example: 5 })
  maxStamina!: number;

  @ApiProperty({ description: "所属月份", example: "2026-09" })
  month!: string;
}
