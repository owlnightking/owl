export interface StaminaAccountItem {
  userId: number;
  current: number;
  maxStamina: number;
  month: string;
}

export interface StaminaRepositoryPort {
  getAccount(userId: number): Promise<StaminaAccountItem>;
  deduct(userId: number, amount: number): Promise<boolean>;
  resetMonthly(): Promise<void>;
}

export const STAMINA_REPOSITORY = Symbol("STAMINA_REPOSITORY");
export const STAMINA_SERVICE = Symbol("STAMINA_SERVICE");
