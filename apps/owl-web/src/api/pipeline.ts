// 产品线流水线前端类型与中文标签（与后端 VO 对齐）
import {
  CAMPAIGN_STATUS,
  CAMPAIGN_TYPE,
  DESIGN_TASK_STATUS,
  DESIGN_TASK_TYPE,
  INVEST_DECISION_RESULT,
  IPD_STAGE_LABELS,
  KOL_COOP_STATUS,
  LIFECYCLE_STAGE_LABELS,
  OVERSEAS_WAREHOUSE,
  PRODUCT_LINE_IPD_STAGE,
  PRODUCT_LINE_LIFECYCLE_STAGE,
  PRODUCTION_STATUS,
  PRODUCTION_TYPE,
  RESEARCH_TYPE,
  ROI_REVIEW_DECISION,
  ROI_REVIEW_PHASE,
  SHIPMENT_MODE,
  SHIPMENT_STATUS,
  SPU_STATUS,
  SUPPLIER_COOP_STATUS,
  VOC_CATEGORY,
  VOC_SOURCE,
  VOC_STATUS,
  type ProductLineIpdStage,
  type ProductLineLifecycleStage,
} from "@owl/shared";

export interface PageData<T> {
  list: T[];
  pageNum: number;
  pageSize: number;
  total: number;
}

export interface ProductLineItem {
  id: number;
  code: string;
  name: string;
  styleDesc: string | null;
  ipdStage: string;
  lifecycleStage: string;
  targetMarket: string | null;
  notes: string | null;
  spuCount: number;
  createdAt: string;
}

export interface SpuItem {
  id: number;
  productLineId: number;
  internalCode: string;
  spuCode: string | null;
  name: string;
  status: string;
  launchAt: string | null;
  notes: string | null;
  skuCount: number;
  createdAt: string;
}

export interface SkuItem {
  id: number;
  spuId: number;
  skuCode: string;
  name: string;
  priceUsd: number;
  limited: boolean;
  stock: number;
  enabled: boolean;
  notes: string | null;
  createdAt: string;
}

export interface ResearchItem {
  id: number;
  productLineId: number;
  type: string;
  title: string;
  content: string | null;
  sourceRef: string | null;
  createdAt: string;
}

export interface DesignTaskItem {
  id: number;
  productLineId: number;
  type: string;
  title: string;
  status: string;
  feasible: boolean | null;
  notes: string | null;
  createdAt: string;
}

export interface PrototypeReviewItem {
  id: number;
  productLineId: number;
  sampleReady: boolean;
  reviewPassed: boolean;
  reviewNotes: string | null;
  sharedWithGtm: boolean;
  sharedAt: string | null;
  updatedAt: string;
}

export interface InvestDecisionItem {
  id: number;
  productLineId: number;
  gtmFeedbackSummary: string | null;
  iscSummary: string | null;
  targetPriceUsd: number | null;
  unitCostUsd: number | null;
  result: string;
  decidedAt: string | null;
  notes: string | null;
  updatedAt: string;
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
  createdAt: string;
}

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
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
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
  createdAt: string;
}

export interface FeedbackItem {
  id: number;
  productLineId: number;
  type: string;
  content: string;
  source: string | null;
  collectedAt: string;
  createdAt: string;
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
  startAt: string | null;
  endAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SupplierItem {
  id: number;
  name: string;
  contact: string | null;
  region: string | null;
  coopStatus: string;
  capability: string | null;
  notes: string | null;
  createdAt: string;
}

export interface QuoteItem {
  id: number;
  supplierId: number;
  supplierName: string;
  productLineId: number | null;
  productLineName: string | null;
  spuId: number | null;
  spuName: string | null;
  itemName: string;
  amountCny: number;
  exchangeRate: number;
  amountUsd: number;
  quotedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface ProductionItem {
  id: number;
  spuId: number;
  spuName: string;
  supplierId: number;
  supplierName: string;
  type: string;
  quantity: number;
  status: string;
  plannedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ShipmentItem {
  id: number;
  productLineId: number;
  productLineName: string;
  spuId: number | null;
  spuName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  mode: string;
  warehouse: string;
  status: string;
  trackingRef: string | null;
  costCny: number | null;
  exchangeRate: number | null;
  costUsd: number | null;
  etaDate: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface VocTicketItem {
  id: number;
  source: string;
  productLineId: number | null;
  productLineName: string | null;
  spuId: number | null;
  spuName: string | null;
  title: string;
  content: string | null;
  category: string;
  status: string;
  handledNote: string | null;
  createdAt: string;
}

export const IPD_STAGE_ORDER: ProductLineIpdStage[] = [
  PRODUCT_LINE_IPD_STAGE.OPPORTUNITY,
  PRODUCT_LINE_IPD_STAGE.PROPOSAL,
  PRODUCT_LINE_IPD_STAGE.FINALIZE,
  PRODUCT_LINE_IPD_STAGE.DECISION,
  PRODUCT_LINE_IPD_STAGE.REVIEW,
];

export { IPD_STAGE_LABELS, LIFECYCLE_STAGE_LABELS };

export const LIFECYCLE_STAGE_OPTIONS = Object.entries(PRODUCT_LINE_LIFECYCLE_STAGE).map(([key, value]) => ({
  key,
  label: LIFECYCLE_STAGE_LABELS[value],
  value,
}));

export function ipdStageLabel(stage: string): string {
  return IPD_STAGE_LABELS[stage as ProductLineIpdStage] ?? stage;
}

export function lifecycleStageLabel(stage: string): string {
  return LIFECYCLE_STAGE_LABELS[stage as ProductLineLifecycleStage] ?? stage;
}

export const RESEARCH_TYPE_LABELS: Record<string, string> = {
  [RESEARCH_TYPE.COMPETITOR]: "竞品调研",
  [RESEARCH_TYPE.MARKET]: "市场调研",
  [RESEARCH_TYPE.VOC]: "用户反馈调研",
};

export const DESIGN_TASK_TYPE_LABELS: Record<string, string> = {
  [DESIGN_TASK_TYPE.PRODUCT]: "产品设计",
  [DESIGN_TASK_TYPE.APPEARANCE]: "外观设计",
  [DESIGN_TASK_TYPE.MECHANISM]: "结构设计",
  [DESIGN_TASK_TYPE.PACKAGING]: "包装设计",
};

export const DESIGN_TASK_STATUS_LABELS: Record<string, string> = {
  [DESIGN_TASK_STATUS.PENDING]: "待开始",
  [DESIGN_TASK_STATUS.IN_PROGRESS]: "进行中",
  [DESIGN_TASK_STATUS.DONE]: "已完成",
};

export const INVEST_RESULT_LABELS: Record<string, string> = {
  [INVEST_DECISION_RESULT.PENDING]: "待决策",
  [INVEST_DECISION_RESULT.APPROVED]: "通过",
  [INVEST_DECISION_RESULT.REJECTED]: "驳回",
};

export const ROI_PHASE_LABELS: Record<string, string> = {
  [ROI_REVIEW_PHASE.PRESALE]: "预售期",
  [ROI_REVIEW_PHASE.LISTED]: "上市后",
};

export const ROI_DECISION_LABELS: Record<string, string> = {
  [ROI_REVIEW_DECISION.PRICE_REDUCE]: "降价",
  [ROI_REVIEW_DECISION.COST_DOWN]: "降本",
  [ROI_REVIEW_DECISION.LIQUIDATE]: "清货",
  [ROI_REVIEW_DECISION.NEW_OPPORTUNITY]: "新机会",
  [ROI_REVIEW_DECISION.HOLD]: "维持",
};

export const SPU_STATUS_LABELS: Record<string, string> = {
  [SPU_STATUS.CONCEPT]: "概念",
  [SPU_STATUS.DEVELOPING]: "开发中",
  [SPU_STATUS.PRESALE]: "预售",
  [SPU_STATUS.ON_SALE]: "在售",
  [SPU_STATUS.MATURE]: "成熟",
  [SPU_STATUS.LIQUIDATING]: "清货",
  [SPU_STATUS.DELISTED]: "下架",
};

export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  [CAMPAIGN_TYPE.WARMUP]: "预热",
  [CAMPAIGN_TYPE.PRESALE]: "预售",
  [CAMPAIGN_TYPE.LAUNCH]: "首发",
  [CAMPAIGN_TYPE.TRAFFIC]: "投流",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  [CAMPAIGN_STATUS.PLANNED]: "计划中",
  [CAMPAIGN_STATUS.RUNNING]: "进行中",
  [CAMPAIGN_STATUS.ENDED]: "已结束",
};

export const KOL_STATUS_LABELS: Record<string, string> = {
  [KOL_COOP_STATUS.CONTACTING]: "接洽中",
  [KOL_COOP_STATUS.COOPERATING]: "合作中",
  [KOL_COOP_STATUS.ENDED]: "已结束",
};

export const SUPPLIER_STATUS_LABELS: Record<string, string> = {
  [SUPPLIER_COOP_STATUS.POTENTIAL]: "意向",
  [SUPPLIER_COOP_STATUS.ACTIVE]: "合作中",
  [SUPPLIER_COOP_STATUS.PAUSED]: "暂停",
  [SUPPLIER_COOP_STATUS.ENDED]: "已结束",
};

export const PRODUCTION_TYPE_LABELS: Record<string, string> = {
  [PRODUCTION_TYPE.PILOT]: "试产",
  [PRODUCTION_TYPE.RAMP]: "爬坡",
  [PRODUCTION_TYPE.MASS]: "量产",
};

export const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  [PRODUCTION_STATUS.PLANNED]: "计划中",
  [PRODUCTION_STATUS.PRODUCING]: "生产中",
  [PRODUCTION_STATUS.COMPLETED]: "已完成",
};

export const SHIPMENT_MODE_LABELS: Record<string, string> = {
  [SHIPMENT_MODE.SEA]: "海运",
  [SHIPMENT_MODE.AIR]: "空运",
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  [SHIPMENT_STATUS.PENDING]: "待发运",
  [SHIPMENT_STATUS.HEAD_HAUL]: "头程中",
  [SHIPMENT_STATUS.IN_TRANSIT]: "在途",
  [SHIPMENT_STATUS.CUSTOMS]: "清关中",
  [SHIPMENT_STATUS.WAREHOUSE]: "已入仓",
  [SHIPMENT_STATUS.RECEIVED]: "已签收",
};

export const WAREHOUSE_LABELS: Record<string, string> = {
  [OVERSEAS_WAREHOUSE.TIKTOK_US]: "TikTok 美国仓",
  [OVERSEAS_WAREHOUSE.TIKTOK_AU]: "TikTok 澳洲仓",
  [OVERSEAS_WAREHOUSE.TIKTOK_NZ]: "TikTok 新西兰仓",
  [OVERSEAS_WAREHOUSE.OTHER]: "其他仓",
};

export const VOC_SOURCE_LABELS: Record<string, string> = {
  [VOC_SOURCE.AFTER_SALE_EMAIL]: "售后邮箱",
  [VOC_SOURCE.COMMUNITY]: "社群",
  [VOC_SOURCE.WORKSHOP_COMMENT]: "工坊留言",
  [VOC_SOURCE.WHATSAPP]: "WhatsApp",
  [VOC_SOURCE.TWITTER_DM]: "Twitter 私信",
};

export const VOC_CATEGORY_LABELS: Record<string, string> = {
  [VOC_CATEGORY.IMPROVEMENT]: "改进建议",
  [VOC_CATEGORY.COMPLAINT]: "投诉",
  [VOC_CATEGORY.PRAISE]: "好评",
  [VOC_CATEGORY.INQUIRY]: "咨询",
  [VOC_CATEGORY.OTHER]: "其他",
};

export const VOC_STATUS_LABELS: Record<string, string> = {
  [VOC_STATUS.NEW]: "新建",
  [VOC_STATUS.TRIAGED]: "已归类",
  [VOC_STATUS.RESOLVED]: "已解决",
  [VOC_STATUS.IGNORED]: "已忽略",
};

export function toDateOnly(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCnyWithUsd(cny: number | null | undefined, usd: number | null | undefined): string {
  if (cny === null || cny === undefined) return "-";
  const cnyText = `¥${cny.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (usd === null || usd === undefined) return cnyText;
  return `${formatUsd(usd)}（${cnyText}）`;
}
