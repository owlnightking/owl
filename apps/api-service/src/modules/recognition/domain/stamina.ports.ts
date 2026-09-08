export interface StaminaAccountItem {
  userId: string;
  current: number;
  maxStamina: number;
  month: string;
}

export interface StaminaRepositoryPort {
  getAccount(userId: string): Promise<StaminaAccountItem>;
  deduct(userId: string, amount: number): Promise<boolean>;
  resetMonthly(): Promise<void>;
}

export const STAMINA_REPOSITORY = Symbol("STAMINA_REPOSITORY");
export const STAMINA_SERVICE = Symbol("STAMINA_SERVICE");
