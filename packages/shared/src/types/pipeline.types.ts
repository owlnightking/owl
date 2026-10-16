// 主领域：产品线流水线（IPD/GTM/ISC/VOC）共享枚举与类型
// 金额口径：全局美元（USD）为准；人民币（CNY）录入后经汇率表折算，展示主美元副原币

export const PRODUCT_LINE_IPD_STAGE = {
  OPPORTUNITY: "opportunity",
  PROPOSAL: "proposal",
  FINALIZE: "finalize",
  DECISION: "decision",
  REVIEW: "review",
} as const;
export type ProductLineIpdStage = (typeof PRODUCT_LINE_IPD_STAGE)[keyof typeof PRODUCT_LINE_IPD_STAGE];

export const PRODUCT_LINE_LIFECYCLE_STAGE = {
  INCUBATING: "incubating",
  PRESALE: "presale",
  NEW_PRODUCT: "new_product",
  MATURE: "mature",
  LIQUIDATION: "liquidation",
} as const;
export type ProductLineLifecycleStage =
  (typeof PRODUCT_LINE_LIFECYCLE_STAGE)[keyof typeof PRODUCT_LINE_LIFECYCLE_STAGE];

export const SPU_STATUS = {
  CONCEPT: "concept",
  DEVELOPING: "developing",
  PRESALE: "presale",
  ON_SALE: "on_sale",
  MATURE: "mature",
  LIQUIDATING: "liquidating",
  DELISTED: "delisted",
} as const;
export type SpuStatus = (typeof SPU_STATUS)[keyof typeof SPU_STATUS];

export const RESEARCH_TYPE = {
  COMPETITOR: "competitor",
  MARKET: "market",
  VOC: "voc",
} as const;
export type ResearchType = (typeof RESEARCH_TYPE)[keyof typeof RESEARCH_TYPE];

export const DESIGN_TASK_TYPE = {
  PRODUCT: "product",
  APPEARANCE: "appearance",
  MECHANISM: "mechanism",
  PACKAGING: "packaging",
} as const;
export type DesignTaskType = (typeof DESIGN_TASK_TYPE)[keyof typeof DESIGN_TASK_TYPE];

export const DESIGN_TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;
export type DesignTaskStatus = (typeof DESIGN_TASK_STATUS)[keyof typeof DESIGN_TASK_STATUS];

export const INVEST_DECISION_RESULT = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
export type InvestDecisionResult = (typeof INVEST_DECISION_RESULT)[keyof typeof INVEST_DECISION_RESULT];

export const ROI_REVIEW_PHASE = {
  PRESALE: "presale",
  LISTED: "listed",
} as const;
export type RoiReviewPhase = (typeof ROI_REVIEW_PHASE)[keyof typeof ROI_REVIEW_PHASE];

export const ROI_REVIEW_DECISION = {
  PRICE_REDUCE: "price_reduce",
  COST_DOWN: "cost_down",
  LIQUIDATE: "liquidate",
  NEW_OPPORTUNITY: "new_opportunity",
  HOLD: "hold",
} as const;
export type RoiReviewDecision = (typeof ROI_REVIEW_DECISION)[keyof typeof ROI_REVIEW_DECISION];

export const CAMPAIGN_TYPE = {
  WARMUP: "warmup",
  PRESALE: "presale",
  LAUNCH: "launch",
  TRAFFIC: "traffic",
} as const;
export type CampaignType = (typeof CAMPAIGN_TYPE)[keyof typeof CAMPAIGN_TYPE];

export const CAMPAIGN_PLATFORM = {
  TIKTOK: "tiktok",
  INSTAGRAM: "instagram",
  TWITTER: "twitter",
  YOUTUBE: "youtube",
  FACEBOOK: "facebook",
  OTHER: "other",
} as const;
export type CampaignPlatform = (typeof CAMPAIGN_PLATFORM)[keyof typeof CAMPAIGN_PLATFORM];

export const CAMPAIGN_STATUS = {
  PLANNED: "planned",
  RUNNING: "running",
  ENDED: "ended",
} as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const KOL_COOP_STATUS = {
  CONTACTING: "contacting",
  COOPERATING: "cooperating",
  ENDED: "ended",
} as const;
export type KolCoopStatus = (typeof KOL_COOP_STATUS)[keyof typeof KOL_COOP_STATUS];

export const COMMUNITY_FEEDBACK_TYPE = {
  EXPECTATION: "expectation",
  IMPROVEMENT: "improvement",
  STATUS_FOLLOW: "status_follow",
  OTHER: "other",
} as const;
export type CommunityFeedbackType = (typeof COMMUNITY_FEEDBACK_TYPE)[keyof typeof COMMUNITY_FEEDBACK_TYPE];

export const SUPPLIER_COOP_STATUS = {
  POTENTIAL: "potential",
  ACTIVE: "active",
  PAUSED: "paused",
  ENDED: "ended",
} as const;
export type SupplierCoopStatus = (typeof SUPPLIER_COOP_STATUS)[keyof typeof SUPPLIER_COOP_STATUS];

export const PRODUCTION_TYPE = {
  PILOT: "pilot",
  RAMP: "ramp",
  MASS: "mass",
} as const;
export type ProductionType = (typeof PRODUCTION_TYPE)[keyof typeof PRODUCTION_TYPE];

export const PRODUCTION_STATUS = {
  PLANNED: "planned",
  PRODUCING: "producing",
  COMPLETED: "completed",
} as const;
export type ProductionStatus = (typeof PRODUCTION_STATUS)[keyof typeof PRODUCTION_STATUS];

export const SHIPMENT_MODE = {
  SEA: "sea",
  AIR: "air",
} as const;
export type ShipmentMode = (typeof SHIPMENT_MODE)[keyof typeof SHIPMENT_MODE];

export const SHIPMENT_STATUS = {
  PENDING: "pending",
  HEAD_HAUL: "head_haul",
  IN_TRANSIT: "in_transit",
  CUSTOMS: "customs",
  WAREHOUSE: "warehouse",
  RECEIVED: "received",
} as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUS)[keyof typeof SHIPMENT_STATUS];

export const OVERSEAS_WAREHOUSE = {
  TIKTOK_US: "tiktok_us",
  TIKTOK_AU: "tiktok_au",
  TIKTOK_NZ: "tiktok_nz",
  OTHER: "other",
} as const;
export type OverseasWarehouse = (typeof OVERSEAS_WAREHOUSE)[keyof typeof OVERSEAS_WAREHOUSE];

export const VOC_SOURCE = {
  AFTER_SALE_EMAIL: "after_sale_email",
  COMMUNITY: "community",
  WORKSHOP_COMMENT: "workshop_comment",
  WHATSAPP: "whatsapp",
  TWITTER_DM: "twitter_dm",
} as const;
export type VocSource = (typeof VOC_SOURCE)[keyof typeof VOC_SOURCE];

export const VOC_CATEGORY = {
  IMPROVEMENT: "improvement",
  COMPLAINT: "complaint",
  PRAISE: "praise",
  INQUIRY: "inquiry",
  OTHER: "other",
} as const;
export type VocCategory = (typeof VOC_CATEGORY)[keyof typeof VOC_CATEGORY];

export const VOC_STATUS = {
  NEW: "new",
  TRIAGED: "triaged",
  RESOLVED: "resolved",
  IGNORED: "ignored",
} as const;
export type VocStatus = (typeof VOC_STATUS)[keyof typeof VOC_STATUS];

export const CURRENCY = {
  USD: "USD",
  CNY: "CNY",
} as const;
export type CurrencyCode = (typeof CURRENCY)[keyof typeof CURRENCY];

export const EXCHANGE_RATE_SOURCE = {
  API: "api",
  MANUAL: "manual",
} as const;
export type ExchangeRateSource = (typeof EXCHANGE_RATE_SOURCE)[keyof typeof EXCHANGE_RATE_SOURCE];

export const IPD_STAGE_LABELS: Record<ProductLineIpdStage, string> = {
  opportunity: "机会判断",
  proposal: "立项",
  finalize: "定型",
  decision: "投决",
  review: "经营复盘",
};

export const LIFECYCLE_STAGE_LABELS: Record<ProductLineLifecycleStage, string> = {
  incubating: "立项期",
  presale: "预售期",
  new_product: "新品期",
  mature: "成熟期",
  liquidation: "清货期",
};
