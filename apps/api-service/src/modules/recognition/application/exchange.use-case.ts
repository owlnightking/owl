import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  EXCHANGE_REPOSITORY,
  type ExchangeCreateInput,
  type ExchangeListQuery,
  type ExchangeOrderItem,
  type ExchangeRepositoryPort,
} from "../domain/exchange.ports";
import { COIN_REPOSITORY, type CoinRepositoryPort } from "../domain/coin.ports";
import { PRODUCT_REPOSITORY, type ProductRepositoryPort } from "../domain/product.ports";
import { NOTIFICATION_SERVICE, type NotificationRepositoryPort } from "../../notification/index";

@Injectable()
export class ExchangeUseCase {
  constructor(
    @Inject(EXCHANGE_REPOSITORY) private readonly exchangeRepo: ExchangeRepositoryPort,
    @Inject(COIN_REPOSITORY) private readonly coinRepo: CoinRepositoryPort,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: ProductRepositoryPort,
    @Inject(NOTIFICATION_SERVICE) private readonly notificationRepo: NotificationRepositoryPort
  ) {}

  async create(userId: string, input: ExchangeCreateInput): Promise<ExchangeOrderItem> {
    const product = await this.productRepo.findById(input.productId);
    if (!product) throw new NotFoundException("product not found");
    if (!product.enabled) throw new ForbiddenException("product disabled");

    const quantity = input.quantity ?? 1;
    const totalCost = product.price * quantity;

    const account = await this.coinRepo.getAccount(userId);
    if (account.balance < totalCost) throw new ForbiddenException("insufficient coins");

    await this.coinRepo.deductBalance(userId, totalCost, "exchange", undefined, `兑换: ${product.name} x${quantity}`);
    return this.exchangeRepo.create(userId, input);
  }

  async approve(id: string, approverId: string): Promise<void> {
    const order = await this.exchangeRepo.findById(id);
    if (!order) throw new NotFoundException(`exchange order ${id} not found`);
    if (order.status !== "pending") throw new ForbiddenException("already processed");
    await this.exchangeRepo.approve(id, approverId);

    await this.notificationRepo.create({
      userId: order.userId,
      title: "兑换已通过",
      content: `你的兑换订单已通过审批，请前往领取`,
      type: "exchange",
    });
  }

  async reject(id: string, approverId: string, reason?: string): Promise<void> {
    const order = await this.exchangeRepo.findById(id);
    if (!order) throw new NotFoundException(`exchange order ${id} not found`);
    if (order.status !== "pending") throw new ForbiddenException("already processed");

    await this.exchangeRepo.reject(id, approverId, reason);
    await this.coinRepo.addBalance(order.userId, order.totalCost, "exchange_refund", id, `兑换驳回退款`);

    await this.notificationRepo.create({
      userId: order.userId,
      title: "兑换已驳回",
      content: `你的兑换订单已驳回，${order.totalCost} 币已退还${reason ? `：${reason}` : ""}`,
      type: "exchange",
    });
  }

  async fulfill(id: string): Promise<void> {
    const order = await this.exchangeRepo.findById(id);
    await this.exchangeRepo.fulfill(id);

    if (order) {
      await this.notificationRepo.create({
        userId: order.userId,
        title: "兑换已核销",
        content: `你的兑换商品已核销完成`,
        type: "exchange",
      });
    }
  }

  async list(query: ExchangeListQuery): Promise<{ items: ExchangeOrderItem[]; total: number }> {
    return this.exchangeRepo.list(query);
  }

  async countPending(): Promise<number> {
    return this.exchangeRepo.countPending();
  }
}
