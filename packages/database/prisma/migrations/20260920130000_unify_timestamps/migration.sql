-- 统一所有数据表时间戳：createdAt + updatedAt，精度到秒（年月日时分秒）
-- 数据保全：新增列带 DEFAULT CURRENT_TIMESTAMP 回填；所有 timestamp 列降为 (0) 精度

-- 1. 补齐缺失的 created_at / updated_at（精确到秒）
ALTER TABLE "system_config" ADD COLUMN "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "scheduler_config" ADD COLUMN "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "coin_account" ADD COLUMN "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "stamina_account" ADD COLUMN "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "role_permission" ADD COLUMN "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_role" ADD COLUMN "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "sync_log" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "permission" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "auth_session" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "audit_log" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "notification" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "file" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "mcp_tool_log" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "mcp_session" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "recognition_like" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "coin_transaction" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "scheduler_run" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "md_doc_image" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "role_permission" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user_role" ADD COLUMN "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. 所有 timestamp 列精度降为秒（0）
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'timestamp without time zone'
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TIMESTAMP(0)', r.table_name, r.column_name);
  END LOOP;
END $$;

-- 3. created_at / updated_at 统一补齐数据库默认值（与 schema @default(now()) 对齐）
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP', r.table_name);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP', r.table_name);
  END LOOP;
END $$;
