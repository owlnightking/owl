// IPD 子资源：机会判断材料 / 立项设计任务 / 定型评审 / 投决 / 经营复盘

export interface ResearchItem {
  id: number;
  productLineId: number;
  type: string;
  title: string;
  content: string | null;
  sourceRef: string | null;
  createdAt: Date;
}

export interface ResearchCreateInput {
  type: string;
  title: string;
  content?: string;
  sourceRef?: string;
}

export interface ResearchUpdateInput {
  type?: string;
  title?: string;
  content?: string;
  sourceRef?: string;
}

export interface DesignTaskItem {
  id: number;
  productLineId: number;
  type: string;
  title: string;
  status: string;
  feasible: boolean | null;
  notes: string | null;
  createdAt: Date;
}

export interface DesignTaskCreateInput {
  type: string;
  title: string;
  status?: string;
  feasible?: boolean;
  notes?: string;
}

export interface DesignTaskUpdateInput {
  type?: string;
  title?: string;
  status?: string;
  feasible?: boolean;
  notes?: string;
}

export interface PrototypeReviewItem {
  id: number;
  productLineId: number;
  sampleReady: boolean;
  reviewPassed: boolean;
  reviewNotes: string | null;
  sharedWithGtm: boolean;
  sharedAt: Date | null;
  updatedAt: Date;
}

export interface PrototypeReviewInput {
  sampleReady?: boolean;
  reviewPassed?: boolean;
  reviewNotes?: string;
  sharedWithGtm?: boolean;
}

export interface InvestDecisionItem {
  id: number;
  productLineId: number;
  gtmFeedbackSummary: string | null;
  iscSummary: string | null;
  targetPriceUsd: number | null;
  unitCostUsd: number | null;
  result: string;
  decidedAt: Date | null;
  notes: string | null;
  updatedAt: Date;
}

export interface InvestDecisionInput {
  gtmFeedbackSummary?: string;
  iscSummary?: string;
  targetPriceUsd?: number;
  unitCostUsd?: number;
  result?: string;
  notes?: string;
}

export interface RoiReviewItem {
  id: number;
  productLineId: number;
  phase: string;
  salesUsd: number;
  adCostUsd: number;
  productCostUsd: number;
  fulfillmentCostUsd: number;
  refundUsd: number;
  afterSaleCostUsd: number;
  roi: number | null;
  decision: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface RoiReviewCreateInput {
  phase: string;
  salesUsd?: number;
  adCostUsd?: number;
  productCostUsd?: number;
  fulfillmentCostUsd?: number;
  refundUsd?: number;
  afterSaleCostUsd?: number;
  roi?: number;
  decision?: string;
  notes?: string;
}

export interface RoiReviewUpdateInput {
  salesUsd?: number;
  adCostUsd?: number;
  productCostUsd?: number;
  fulfillmentCostUsd?: number;
  refundUsd?: number;
  afterSaleCostUsd?: number;
  roi?: number;
  decision?: string;
  notes?: string;
}

export interface IpdStageRepositoryPort {
  listResearches(productLineId: number): Promise<ResearchItem[]>;
  createResearch(productLineId: number, input: ResearchCreateInput): Promise<ResearchItem>;
  updateResearch(id: number, input: ResearchUpdateInput): Promise<ResearchItem | null>;
  removeResearch(id: number): Promise<void>;

  listDesignTasks(productLineId: number): Promise<DesignTaskItem[]>;
  createDesignTask(productLineId: number, input: DesignTaskCreateInput): Promise<DesignTaskItem>;
  updateDesignTask(id: number, input: DesignTaskUpdateInput): Promise<DesignTaskItem | null>;
  removeDesignTask(id: number): Promise<void>;

  getPrototype(productLineId: number): Promise<PrototypeReviewItem | null>;
  upsertPrototype(productLineId: number, input: PrototypeReviewInput): Promise<PrototypeReviewItem>;

  getDecision(productLineId: number): Promise<InvestDecisionItem | null>;
  upsertDecision(productLineId: number, input: InvestDecisionInput): Promise<InvestDecisionItem>;

  listReviews(productLineId: number): Promise<RoiReviewItem[]>;
  createReview(productLineId: number, input: RoiReviewCreateInput): Promise<RoiReviewItem>;
  updateReview(id: number, input: RoiReviewUpdateInput): Promise<RoiReviewItem | null>;
  removeReview(id: number): Promise<void>;
}

export const IPD_STAGE_REPOSITORY = Symbol("IPD_STAGE_REPOSITORY");
export const IPD_STAGE_SERVICE = Symbol("IPD_STAGE_SERVICE");
