// GTM 域端口：campaign / KOL / 社群反馈 / 预售批次

export interface CampaignItem {
  id: number;
  productLineId: number;
  name: string;
  type: string;
  platform: string;
  status: string;
  kolId: number | null;
  kolName: string | null;
  budgetUsd: number;
  spentUsd: number;
  feedbackNotes: string | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface CampaignCreateInput {
  name: string;
  type: string;
  platform?: string;
  status?: string;
  kolId?: number;
  budgetUsd?: number;
  spentUsd?: number;
  feedbackNotes?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export interface CampaignUpdateInput {
  name?: string;
  type?: string;
  platform?: string;
  status?: string;
  kolId?: number;
  budgetUsd?: number;
  spentUsd?: number;
  feedbackNotes?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export interface CampaignListOptions {
  productLineId?: number;
  type?: string;
  platform?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export interface KolItem {
  id: number;
  name: string;
  platform: string;
  handle: string | null;
  followers: number;
  coopStatus: string;
  contactInfo: string | null;
  totalSpentUsd: number;
  cooperationNotes: string | null;
  createdAt: Date;
}

export interface KolCreateInput {
  name: string;
  platform?: string;
  handle?: string;
  followers?: number;
  coopStatus?: string;
  contactInfo?: string;
  totalSpentUsd?: number;
  cooperationNotes?: string;
}

export interface KolUpdateInput {
  name?: string;
  platform?: string;
  handle?: string;
  followers?: number;
  coopStatus?: string;
  contactInfo?: string;
  totalSpentUsd?: number;
  cooperationNotes?: string;
}

export interface KolListOptions {
  keyword?: string;
  platform?: string;
  coopStatus?: string;
  page: number;
  pageSize: number;
}

export interface FeedbackItem {
  id: number;
  productLineId: number;
  type: string;
  content: string;
  source: string | null;
  collectedAt: Date;
  createdAt: Date;
}

export interface FeedbackCreateInput {
  type: string;
  content: string;
  source?: string;
  collectedAt?: Date;
}

export interface FeedbackUpdateInput {
  type?: string;
  content?: string;
  source?: string;
}

export interface FeedbackListOptions {
  productLineId?: number;
  type?: string;
  page: number;
  pageSize: number;
}

export interface PresaleItem {
  id: number;
  spuId: number;
  productLineId: number;
  spuName: string;
  name: string;
  limited: boolean;
  quantity: number;
  priceUsd: number;
  startAt: Date | null;
  endAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface PresaleCreateInput {
  productLineId?: number;
  name: string;
  limited?: boolean;
  quantity?: number;
  priceUsd?: number;
  startAt?: Date;
  endAt?: Date;
  notes?: string;
}

export interface PresaleUpdateInput {
  name?: string;
  limited?: boolean;
  quantity?: number;
  priceUsd?: number;
  startAt?: Date;
  endAt?: Date;
  notes?: string;
}

export interface PresaleListOptions {
  productLineId?: number;
  spuId?: number;
  page: number;
  pageSize: number;
}

export interface GtmRepositoryPort {
  listCampaigns(options: CampaignListOptions): Promise<{ items: CampaignItem[]; total: number }>;
  createCampaign(productLineId: number, input: CampaignCreateInput): Promise<CampaignItem>;
  updateCampaign(id: number, input: CampaignUpdateInput): Promise<CampaignItem | null>;
  removeCampaign(id: number): Promise<void>;

  listKols(options: KolListOptions): Promise<{ items: KolItem[]; total: number }>;
  findKolById(id: number): Promise<KolItem | null>;
  createKol(input: KolCreateInput): Promise<KolItem>;
  updateKol(id: number, input: KolUpdateInput): Promise<KolItem | null>;
  removeKol(id: number): Promise<void>;

  listFeedbacks(options: FeedbackListOptions): Promise<{ items: FeedbackItem[]; total: number }>;
  createFeedback(productLineId: number, input: FeedbackCreateInput): Promise<FeedbackItem>;
  updateFeedback(id: number, input: FeedbackUpdateInput): Promise<FeedbackItem | null>;
  removeFeedback(id: number): Promise<void>;

  listPresales(options: PresaleListOptions): Promise<{ items: PresaleItem[]; total: number }>;
  createPresale(spuId: number, input: PresaleCreateInput & { productLineId: number }): Promise<PresaleItem>;
  updatePresale(id: number, input: PresaleUpdateInput): Promise<PresaleItem | null>;
  removePresale(id: number): Promise<void>;
}

export const GTM_REPOSITORY = Symbol("GTM_REPOSITORY");
export const CAMPAIGN_SERVICE = Symbol("CAMPAIGN_SERVICE");
export const KOL_SERVICE = Symbol("KOL_SERVICE");
export const FEEDBACK_SERVICE = Symbol("FEEDBACK_SERVICE");
export const PRESALE_SERVICE = Symbol("PRESALE_SERVICE");
