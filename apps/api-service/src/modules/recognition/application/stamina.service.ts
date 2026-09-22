import { Inject, Injectable } from "@nestjs/common";
import { STAMINA_REPOSITORY, type StaminaAccountItem, type StaminaRepositoryPort } from "../domain/stamina.ports";

@Injectable()
export class StaminaService {
  constructor(@Inject(STAMINA_REPOSITORY) private readonly repo: StaminaRepositoryPort) {}

  async getAccount(userId: number): Promise<StaminaAccountItem> {
    return this.repo.getAccount(userId);
  }

  async resetMonthly(): Promise<void> {
    await this.repo.resetMonthly();
  }
}
