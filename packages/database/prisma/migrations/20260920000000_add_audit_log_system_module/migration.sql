-- AlterTable: Add system, module, ipRegion columns to audit_log
ALTER TABLE "audit_log" ADD COLUMN "system" TEXT,
ADD COLUMN "module" TEXT,
ADD COLUMN "ip_region" TEXT;
