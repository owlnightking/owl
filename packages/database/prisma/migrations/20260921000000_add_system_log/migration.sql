-- 系统日志表（日志中心 - 系统日志）
CREATE TABLE "system_log" (
  "id" SERIAL NOT NULL,
  "service" TEXT,
  "level" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "request_id" TEXT,
  "method" TEXT,
  "url" TEXT,
  "status" INTEGER,
  "code" INTEGER,
  "user_id" INTEGER,
  "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(0),
  CONSTRAINT "system_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_log_level_created_at_idx" ON "system_log"("level", "created_at");
CREATE INDEX "system_log_service_created_at_idx" ON "system_log"("service", "created_at");
