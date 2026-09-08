import { Inject, Injectable } from "@nestjs/common";
import { DATABASE_CLIENT } from "@owl/database/provider";
import type { PrismaClient } from "@owl/database";
import type { StaminaAccountItem, StaminaRepositoryPort } from "../domain/stamina.ports";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

@Injectable()
export class PrismaStaminaRepository implements StaminaRepositoryPort {
  constructor(@Inject(DATABASE_CLIENT) private readonly prisma: PrismaClient) {}

  async getAccount(userId: string): Promise<StaminaAccountItem> {
    const month = currentMonth();
    let account = await this.prisma.staminaAccount.findUnique({ where: { userId } });
    if (!account || account.month !== month) {
      const maxStamina = account?.maxStamina ?? 50;
      account = await this.prisma.staminaAccount.upsert({
        where: { userId },
        create: { userId, current: maxStamina, maxStamina, month },
        update: { current: maxStamina, month, lastResetAt: new Date() },
      });
    }
    return { userId: account.userId, current: account.current, maxStamina: account.maxStamina, month: account.month };
  }

  async deduct(userId: string, amount: number): Promise<boolean> {
    const account = await this.getAccount(userId);
    if (account.current < amount) return false;
    await this.prisma.staminaAccount.update({ where: { userId }, data: { current: { decrement: amount } } });
    return true;
  }

  async resetMonthly(): Promise<void> {
    const month = currentMonth();
    await this.prisma.staminaAccount.updateMany({
      where: { NOT: { month } },
      data: { month, lastResetAt: new Date() },
    });
    const accounts = await this.prisma.staminaAccount.findMany({ where: { NOT: { month } } });
    for (const a of accounts) {
      await this.prisma.staminaAccount.update({ where: { userId: a.userId }, data: { current: a.maxStamina, month } });
    }
  }
}
