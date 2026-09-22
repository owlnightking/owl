export interface BadgeItem {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  coinReward: number;
  expReward: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface BadgeCreateInput {
  name: string;
  icon?: string;
  description?: string;
  coinReward?: number;
  expReward?: number;
  enabled?: boolean;
  sortOrder?: number;
}

export interface BadgeUpdateInput {
  name?: string;
  icon?: string;
  description?: string;
  coinReward?: number;
  expReward?: number;
  enabled?: boolean;
  sortOrder?: number;
}

export interface BadgeRepositoryPort {
  list(): Promise<BadgeItem[]>;
  findById(id: number): Promise<BadgeItem | null>;
  create(input: BadgeCreateInput): Promise<BadgeItem>;
  update(id: number, input: BadgeUpdateInput): Promise<BadgeItem | null>;
  delete(id: number): Promise<void>;
}

export const BADGE_REPOSITORY = Symbol("BADGE_REPOSITORY");
export const BADGE_SERVICE = Symbol("BADGE_SERVICE");
