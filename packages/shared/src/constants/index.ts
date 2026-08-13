export const PROJECT_NAME = "owl";

export const FRONTEND_ROUTE_PREFIXES = {
  owl: "/owl",
  admin: "/admin",
  cron: "/cron",
} as const;

export const BUSINESS_ROLE_CODES = {
  BUSINESS_USER: "business_user",
  READER: "reader",
} as const;

export const AUTH = {
  JWT_ACCESS_TTL: "2h",
  JWT_REFRESH_TTL: "3d",
  SLIDING_ACTIVE_WINDOW: 24 * 60 * 60 * 1000, // 1 day before expiry -> refresh
  MAX_INACTIVE_DAYS: 7,
} as const;

export const SCHEDULER_MIN_INTERVAL_SECONDS = 60;

export const JOB_STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  RETRYING: "RETRYING",
  DEAD: "DEAD",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
