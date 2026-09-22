-- 全表主键改为 Int 自增 id + 全表软删除（deleted_at）
-- 数据保全策略：新增临时列 -> 按旧 uuid 关联回填 -> 删除旧列 -> 重命名 -> 重建约束
-- 禁止 DROP TABLE / 数据清空

-- ============================================================
-- 1. 软删除列 deleted_at
-- ============================================================
ALTER TABLE "user" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "department" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "sync_log" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "role" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "permission" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "role_permission" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "user_role" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "auth_session" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "audit_log" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "notification" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "file" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "system_config" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "field_config" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "mcp_tool" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "mcp_session" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "mcp_tool_log" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "scheduler_config" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "scheduler_run" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "badge" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "recognition" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "recognition_like" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "coin_account" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "coin_transaction" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "stamina_account" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "product" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "exchange_order" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "md_doc" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "md_doc_image" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- ============================================================
-- 2. 新 id 列（SERIAL 序列，按行自动回填，保持原 id 到 id_new 的映射）
-- ============================================================
CREATE SEQUENCE "user_id_seq";
ALTER TABLE "user" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('user_id_seq');
ALTER SEQUENCE "user_id_seq" OWNED BY "user"."id_new";

CREATE SEQUENCE "department_id_seq";
ALTER TABLE "department" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('department_id_seq');
ALTER SEQUENCE "department_id_seq" OWNED BY "department"."id_new";

CREATE SEQUENCE "sync_log_id_seq";
ALTER TABLE "sync_log" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('sync_log_id_seq');
ALTER SEQUENCE "sync_log_id_seq" OWNED BY "sync_log"."id_new";

CREATE SEQUENCE "role_id_seq";
ALTER TABLE "role" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('role_id_seq');
ALTER SEQUENCE "role_id_seq" OWNED BY "role"."id_new";

CREATE SEQUENCE "permission_id_seq";
ALTER TABLE "permission" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('permission_id_seq');
ALTER SEQUENCE "permission_id_seq" OWNED BY "permission"."id_new";

CREATE SEQUENCE "role_permission_id_seq";
ALTER TABLE "role_permission" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('role_permission_id_seq');
ALTER SEQUENCE "role_permission_id_seq" OWNED BY "role_permission"."id_new";

CREATE SEQUENCE "user_role_id_seq";
ALTER TABLE "user_role" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('user_role_id_seq');
ALTER SEQUENCE "user_role_id_seq" OWNED BY "user_role"."id_new";

CREATE SEQUENCE "auth_session_id_seq";
ALTER TABLE "auth_session" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('auth_session_id_seq');
ALTER SEQUENCE "auth_session_id_seq" OWNED BY "auth_session"."id_new";

CREATE SEQUENCE "audit_log_id_seq";
ALTER TABLE "audit_log" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('audit_log_id_seq');
ALTER SEQUENCE "audit_log_id_seq" OWNED BY "audit_log"."id_new";

CREATE SEQUENCE "notification_id_seq";
ALTER TABLE "notification" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('notification_id_seq');
ALTER SEQUENCE "notification_id_seq" OWNED BY "notification"."id_new";

CREATE SEQUENCE "file_id_seq";
ALTER TABLE "file" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('file_id_seq');
ALTER SEQUENCE "file_id_seq" OWNED BY "file"."id_new";

CREATE SEQUENCE "system_config_id_seq";
ALTER TABLE "system_config" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('system_config_id_seq');
ALTER SEQUENCE "system_config_id_seq" OWNED BY "system_config"."id_new";

CREATE SEQUENCE "field_config_id_seq";
ALTER TABLE "field_config" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('field_config_id_seq');
ALTER SEQUENCE "field_config_id_seq" OWNED BY "field_config"."id_new";

CREATE SEQUENCE "mcp_tool_id_seq";
ALTER TABLE "mcp_tool" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('mcp_tool_id_seq');
ALTER SEQUENCE "mcp_tool_id_seq" OWNED BY "mcp_tool"."id_new";

CREATE SEQUENCE "mcp_session_id_seq";
ALTER TABLE "mcp_session" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('mcp_session_id_seq');
ALTER SEQUENCE "mcp_session_id_seq" OWNED BY "mcp_session"."id_new";

CREATE SEQUENCE "mcp_tool_log_id_seq";
ALTER TABLE "mcp_tool_log" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('mcp_tool_log_id_seq');
ALTER SEQUENCE "mcp_tool_log_id_seq" OWNED BY "mcp_tool_log"."id_new";

CREATE SEQUENCE "scheduler_config_id_seq";
ALTER TABLE "scheduler_config" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('scheduler_config_id_seq');
ALTER SEQUENCE "scheduler_config_id_seq" OWNED BY "scheduler_config"."id_new";

CREATE SEQUENCE "scheduler_run_id_seq";
ALTER TABLE "scheduler_run" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('scheduler_run_id_seq');
ALTER SEQUENCE "scheduler_run_id_seq" OWNED BY "scheduler_run"."id_new";

CREATE SEQUENCE "badge_id_seq";
ALTER TABLE "badge" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('badge_id_seq');
ALTER SEQUENCE "badge_id_seq" OWNED BY "badge"."id_new";

CREATE SEQUENCE "recognition_id_seq";
ALTER TABLE "recognition" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('recognition_id_seq');
ALTER SEQUENCE "recognition_id_seq" OWNED BY "recognition"."id_new";

CREATE SEQUENCE "recognition_like_id_seq";
ALTER TABLE "recognition_like" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('recognition_like_id_seq');
ALTER SEQUENCE "recognition_like_id_seq" OWNED BY "recognition_like"."id_new";

CREATE SEQUENCE "coin_account_id_seq";
ALTER TABLE "coin_account" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('coin_account_id_seq');
ALTER SEQUENCE "coin_account_id_seq" OWNED BY "coin_account"."id_new";

CREATE SEQUENCE "coin_transaction_id_seq";
ALTER TABLE "coin_transaction" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('coin_transaction_id_seq');
ALTER SEQUENCE "coin_transaction_id_seq" OWNED BY "coin_transaction"."id_new";

CREATE SEQUENCE "stamina_account_id_seq";
ALTER TABLE "stamina_account" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('stamina_account_id_seq');
ALTER SEQUENCE "stamina_account_id_seq" OWNED BY "stamina_account"."id_new";

CREATE SEQUENCE "product_id_seq";
ALTER TABLE "product" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('product_id_seq');
ALTER SEQUENCE "product_id_seq" OWNED BY "product"."id_new";

CREATE SEQUENCE "exchange_order_id_seq";
ALTER TABLE "exchange_order" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('exchange_order_id_seq');
ALTER SEQUENCE "exchange_order_id_seq" OWNED BY "exchange_order"."id_new";

CREATE SEQUENCE "md_doc_id_seq";
ALTER TABLE "md_doc" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('md_doc_id_seq');
ALTER SEQUENCE "md_doc_id_seq" OWNED BY "md_doc"."id_new";

CREATE SEQUENCE "md_doc_image_id_seq";
ALTER TABLE "md_doc_image" ADD COLUMN "id_new" integer NOT NULL DEFAULT nextval('md_doc_image_id_seq');
ALTER SEQUENCE "md_doc_image_id_seq" OWNED BY "md_doc_image"."id_new";

-- ============================================================
-- 3. 外键新列 + 按旧 uuid 映射回填
-- ============================================================
-- user_role
ALTER TABLE "user_role" ADD COLUMN "user_id_new" integer;
UPDATE "user_role" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";
ALTER TABLE "user_role" ADD COLUMN "role_id_new" integer;
UPDATE "user_role" c SET "role_id_new" = p."id_new" FROM "role" p WHERE p."id" = c."role_id";

-- role_permission
ALTER TABLE "role_permission" ADD COLUMN "role_id_new" integer;
UPDATE "role_permission" c SET "role_id_new" = p."id_new" FROM "role" p WHERE p."id" = c."role_id";
ALTER TABLE "role_permission" ADD COLUMN "permission_id_new" integer;
UPDATE "role_permission" c SET "permission_id_new" = p."id_new" FROM "permission" p WHERE p."id" = c."permission_id";

-- auth_session.user_id
ALTER TABLE "auth_session" ADD COLUMN "user_id_new" integer;
UPDATE "auth_session" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";

-- audit_log.user_id
ALTER TABLE "audit_log" ADD COLUMN "user_id_new" integer;
UPDATE "audit_log" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";

-- notification.user_id
ALTER TABLE "notification" ADD COLUMN "user_id_new" integer;
UPDATE "notification" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";

-- file.uploaded_by
ALTER TABLE "file" ADD COLUMN "uploaded_by_new" integer;
UPDATE "file" c SET "uploaded_by_new" = p."id_new" FROM "user" p WHERE p."id" = c."uploaded_by";

-- system_config.updated_by
ALTER TABLE "system_config" ADD COLUMN "updated_by_new" integer;
UPDATE "system_config" c SET "updated_by_new" = p."id_new" FROM "user" p WHERE p."id" = c."updated_by";

-- mcp_session.user_id
ALTER TABLE "mcp_session" ADD COLUMN "user_id_new" integer;
UPDATE "mcp_session" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";

-- mcp_tool_log.user_id
ALTER TABLE "mcp_tool_log" ADD COLUMN "user_id_new" integer;
UPDATE "mcp_tool_log" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";

-- scheduler_run.config_id
ALTER TABLE "scheduler_run" ADD COLUMN "config_id_new" integer;
UPDATE "scheduler_run" c SET "config_id_new" = p."id_new" FROM "scheduler_config" p WHERE p."id" = c."config_id";

-- recognition
ALTER TABLE "recognition" ADD COLUMN "sender_id_new" integer;
UPDATE "recognition" c SET "sender_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."sender_id";
ALTER TABLE "recognition" ADD COLUMN "receiver_id_new" integer;
UPDATE "recognition" c SET "receiver_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."receiver_id";
ALTER TABLE "recognition" ADD COLUMN "badge_id_new" integer;
UPDATE "recognition" c SET "badge_id_new" = p."id_new" FROM "badge" p WHERE p."id" = c."badge_id";
ALTER TABLE "recognition" ADD COLUMN "approver_id_new" integer;
UPDATE "recognition" c SET "approver_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."approver_id";

-- recognition_like
ALTER TABLE "recognition_like" ADD COLUMN "recognition_id_new" integer;
UPDATE "recognition_like" c SET "recognition_id_new" = p."id_new" FROM "recognition" p WHERE p."id" = c."recognition_id";
ALTER TABLE "recognition_like" ADD COLUMN "user_id_new" integer;
UPDATE "recognition_like" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";

-- coin_account.user_id
ALTER TABLE "coin_account" ADD COLUMN "user_id_new" integer;
UPDATE "coin_account" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";

-- coin_transaction
ALTER TABLE "coin_transaction" ADD COLUMN "account_id_new" integer;
UPDATE "coin_transaction" c SET "account_id_new" = p."id_new" FROM "coin_account" p WHERE p."id" = c."account_id";
ALTER TABLE "coin_transaction" ADD COLUMN "operator_id_new" integer;
UPDATE "coin_transaction" c SET "operator_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."operator_id";

-- stamina_account.user_id
ALTER TABLE "stamina_account" ADD COLUMN "user_id_new" integer;
UPDATE "stamina_account" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";

-- exchange_order
ALTER TABLE "exchange_order" ADD COLUMN "user_id_new" integer;
UPDATE "exchange_order" c SET "user_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."user_id";
ALTER TABLE "exchange_order" ADD COLUMN "product_id_new" integer;
UPDATE "exchange_order" c SET "product_id_new" = p."id_new" FROM "product" p WHERE p."id" = c."product_id";
ALTER TABLE "exchange_order" ADD COLUMN "approver_id_new" integer;
UPDATE "exchange_order" c SET "approver_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."approver_id";

-- md_doc.author_id
ALTER TABLE "md_doc" ADD COLUMN "author_id_new" integer;
UPDATE "md_doc" c SET "author_id_new" = p."id_new" FROM "user" p WHERE p."id" = c."author_id";

-- md_doc_image
ALTER TABLE "md_doc_image" ADD COLUMN "doc_id_new" integer;
UPDATE "md_doc_image" c SET "doc_id_new" = p."id_new" FROM "md_doc" p WHERE p."id" = c."doc_id";
ALTER TABLE "md_doc_image" ADD COLUMN "file_id_new" integer;
UPDATE "md_doc_image" c SET "file_id_new" = p."id_new" FROM "file" p WHERE p."id" = c."file_id";

-- ============================================================
-- 4. 删除引用 id 的外键约束
-- ============================================================
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_user_id_fkey";
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_role_id_fkey";
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_role_id_fkey";
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_permission_id_fkey";
ALTER TABLE "auth_session" DROP CONSTRAINT "auth_session_user_id_fkey";
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_user_id_fkey";
ALTER TABLE "notification" DROP CONSTRAINT "notification_user_id_fkey";
ALTER TABLE "file" DROP CONSTRAINT "file_uploaded_by_fkey";
ALTER TABLE "mcp_session" DROP CONSTRAINT "mcp_session_user_id_fkey";
ALTER TABLE "mcp_tool_log" DROP CONSTRAINT "mcp_tool_log_user_id_fkey";
ALTER TABLE "scheduler_run" DROP CONSTRAINT "scheduler_run_config_id_fkey";
ALTER TABLE "recognition" DROP CONSTRAINT "recognition_sender_id_fkey";
ALTER TABLE "recognition" DROP CONSTRAINT "recognition_receiver_id_fkey";
ALTER TABLE "recognition" DROP CONSTRAINT "recognition_badge_id_fkey";
ALTER TABLE "recognition_like" DROP CONSTRAINT "recognition_like_recognition_id_fkey";
ALTER TABLE "recognition_like" DROP CONSTRAINT "recognition_like_user_id_fkey";
ALTER TABLE "coin_account" DROP CONSTRAINT "coin_account_user_id_fkey";
ALTER TABLE "coin_transaction" DROP CONSTRAINT "coin_transaction_account_id_fkey";
ALTER TABLE "stamina_account" DROP CONSTRAINT "stamina_account_user_id_fkey";
ALTER TABLE "exchange_order" DROP CONSTRAINT "exchange_order_user_id_fkey";
ALTER TABLE "exchange_order" DROP CONSTRAINT "exchange_order_product_id_fkey";
ALTER TABLE "md_doc" DROP CONSTRAINT "md_doc_author_id_fkey";
ALTER TABLE "md_doc_image" DROP CONSTRAINT "md_doc_image_doc_id_fkey";
ALTER TABLE "md_doc_image" DROP CONSTRAINT "md_doc_image_file_id_fkey";

-- ============================================================
-- 5. 删除主键
-- ============================================================
ALTER TABLE "user" DROP CONSTRAINT "user_pkey";
ALTER TABLE "department" DROP CONSTRAINT "department_pkey";
ALTER TABLE "sync_log" DROP CONSTRAINT "sync_log_pkey";
ALTER TABLE "role" DROP CONSTRAINT "role_pkey";
ALTER TABLE "permission" DROP CONSTRAINT "permission_pkey";
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_pkey";
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_pkey";
ALTER TABLE "auth_session" DROP CONSTRAINT "auth_session_pkey";
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_pkey";
ALTER TABLE "notification" DROP CONSTRAINT "notification_pkey";
ALTER TABLE "file" DROP CONSTRAINT "file_pkey";
ALTER TABLE "system_config" DROP CONSTRAINT "system_config_pkey";
ALTER TABLE "field_config" DROP CONSTRAINT "field_config_pkey";
ALTER TABLE "mcp_tool" DROP CONSTRAINT "mcp_tool_pkey";
ALTER TABLE "mcp_session" DROP CONSTRAINT "mcp_session_pkey";
ALTER TABLE "mcp_tool_log" DROP CONSTRAINT "mcp_tool_log_pkey";
ALTER TABLE "scheduler_config" DROP CONSTRAINT "scheduler_config_pkey";
ALTER TABLE "scheduler_run" DROP CONSTRAINT "scheduler_run_pkey";
ALTER TABLE "badge" DROP CONSTRAINT "badge_pkey";
ALTER TABLE "recognition" DROP CONSTRAINT "recognition_pkey";
ALTER TABLE "recognition_like" DROP CONSTRAINT "recognition_like_pkey";
ALTER TABLE "coin_account" DROP CONSTRAINT "coin_account_pkey";
ALTER TABLE "coin_transaction" DROP CONSTRAINT "coin_transaction_pkey";
ALTER TABLE "stamina_account" DROP CONSTRAINT "stamina_account_pkey";
ALTER TABLE "product" DROP CONSTRAINT "product_pkey";
ALTER TABLE "exchange_order" DROP CONSTRAINT "exchange_order_pkey";
ALTER TABLE "md_doc" DROP CONSTRAINT "md_doc_pkey";
ALTER TABLE "md_doc_image" DROP CONSTRAINT "md_doc_image_pkey";

-- ============================================================
-- 6. 删除旧列（旧 uuid id 与旧外键列，含其上的索引）
-- ============================================================
ALTER TABLE "user" DROP COLUMN "id";
ALTER TABLE "department" DROP COLUMN "id";
ALTER TABLE "sync_log" DROP COLUMN "id";
ALTER TABLE "role" DROP COLUMN "id";
ALTER TABLE "permission" DROP COLUMN "id";
ALTER TABLE "role_permission" DROP COLUMN "role_id", DROP COLUMN "permission_id";
ALTER TABLE "user_role" DROP COLUMN "user_id", DROP COLUMN "role_id";
ALTER TABLE "auth_session" DROP COLUMN "id", DROP COLUMN "user_id";
ALTER TABLE "audit_log" DROP COLUMN "id", DROP COLUMN "user_id";
ALTER TABLE "notification" DROP COLUMN "id", DROP COLUMN "user_id";
ALTER TABLE "file" DROP COLUMN "id", DROP COLUMN "uploaded_by";
ALTER TABLE "system_config" DROP COLUMN "id", DROP COLUMN "updated_by";
ALTER TABLE "field_config" DROP COLUMN "id";
ALTER TABLE "mcp_tool" DROP COLUMN "id";
ALTER TABLE "mcp_session" DROP COLUMN "id", DROP COLUMN "user_id";
ALTER TABLE "mcp_tool_log" DROP COLUMN "id", DROP COLUMN "user_id";
ALTER TABLE "scheduler_config" DROP COLUMN "id";
ALTER TABLE "scheduler_run" DROP COLUMN "id", DROP COLUMN "config_id";
ALTER TABLE "badge" DROP COLUMN "id";
ALTER TABLE "recognition" DROP COLUMN "id", DROP COLUMN "sender_id", DROP COLUMN "receiver_id", DROP COLUMN "badge_id", DROP COLUMN "approver_id";
ALTER TABLE "recognition_like" DROP COLUMN "id", DROP COLUMN "recognition_id", DROP COLUMN "user_id";
ALTER TABLE "coin_account" DROP COLUMN "id", DROP COLUMN "user_id";
ALTER TABLE "coin_transaction" DROP COLUMN "id", DROP COLUMN "account_id", DROP COLUMN "operator_id";
ALTER TABLE "stamina_account" DROP COLUMN "id", DROP COLUMN "user_id";
ALTER TABLE "product" DROP COLUMN "id";
ALTER TABLE "exchange_order" DROP COLUMN "id", DROP COLUMN "user_id", DROP COLUMN "product_id", DROP COLUMN "approver_id";
ALTER TABLE "md_doc" DROP COLUMN "id", DROP COLUMN "author_id";
ALTER TABLE "md_doc_image" DROP COLUMN "id", DROP COLUMN "doc_id", DROP COLUMN "file_id";

-- ============================================================
-- 7. 重命名新列为正式列名
-- ============================================================
ALTER TABLE "user" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "department" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "sync_log" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "role" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "permission" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "role_permission" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "role_permission" RENAME COLUMN "role_id_new" TO "role_id";
ALTER TABLE "role_permission" RENAME COLUMN "permission_id_new" TO "permission_id";
ALTER TABLE "user_role" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "user_role" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "user_role" RENAME COLUMN "role_id_new" TO "role_id";
ALTER TABLE "auth_session" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "auth_session" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "audit_log" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "audit_log" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "notification" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "notification" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "file" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "file" RENAME COLUMN "uploaded_by_new" TO "uploaded_by";
ALTER TABLE "system_config" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "system_config" RENAME COLUMN "updated_by_new" TO "updated_by";
ALTER TABLE "field_config" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "mcp_tool" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "mcp_session" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "mcp_session" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "mcp_tool_log" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "mcp_tool_log" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "scheduler_config" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "scheduler_run" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "scheduler_run" RENAME COLUMN "config_id_new" TO "config_id";
ALTER TABLE "badge" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "recognition" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "recognition" RENAME COLUMN "sender_id_new" TO "sender_id";
ALTER TABLE "recognition" RENAME COLUMN "receiver_id_new" TO "receiver_id";
ALTER TABLE "recognition" RENAME COLUMN "badge_id_new" TO "badge_id";
ALTER TABLE "recognition" RENAME COLUMN "approver_id_new" TO "approver_id";
ALTER TABLE "recognition_like" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "recognition_like" RENAME COLUMN "recognition_id_new" TO "recognition_id";
ALTER TABLE "recognition_like" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "coin_account" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "coin_account" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "coin_transaction" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "coin_transaction" RENAME COLUMN "account_id_new" TO "account_id";
ALTER TABLE "coin_transaction" RENAME COLUMN "operator_id_new" TO "operator_id";
ALTER TABLE "stamina_account" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "stamina_account" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "product" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "exchange_order" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "exchange_order" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "exchange_order" RENAME COLUMN "product_id_new" TO "product_id";
ALTER TABLE "exchange_order" RENAME COLUMN "approver_id_new" TO "approver_id";
ALTER TABLE "md_doc" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "md_doc" RENAME COLUMN "author_id_new" TO "author_id";
ALTER TABLE "md_doc_image" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "md_doc_image" RENAME COLUMN "doc_id_new" TO "doc_id";
ALTER TABLE "md_doc_image" RENAME COLUMN "file_id_new" TO "file_id";

-- ============================================================
-- 8. 非空外键列恢复 NOT NULL
-- ============================================================
ALTER TABLE "role_permission" ALTER COLUMN "role_id" SET NOT NULL;
ALTER TABLE "role_permission" ALTER COLUMN "permission_id" SET NOT NULL;
ALTER TABLE "user_role" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "user_role" ALTER COLUMN "role_id" SET NOT NULL;
ALTER TABLE "auth_session" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "file" ALTER COLUMN "uploaded_by" SET NOT NULL;
ALTER TABLE "mcp_session" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "mcp_tool_log" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "recognition" ALTER COLUMN "sender_id" SET NOT NULL;
ALTER TABLE "recognition" ALTER COLUMN "receiver_id" SET NOT NULL;
ALTER TABLE "recognition_like" ALTER COLUMN "recognition_id" SET NOT NULL;
ALTER TABLE "recognition_like" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "coin_account" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "coin_transaction" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "stamina_account" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "exchange_order" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "exchange_order" ALTER COLUMN "product_id" SET NOT NULL;
ALTER TABLE "md_doc" ALTER COLUMN "author_id" SET NOT NULL;
ALTER TABLE "md_doc_image" ALTER COLUMN "doc_id" SET NOT NULL;
ALTER TABLE "md_doc_image" ALTER COLUMN "file_id" SET NOT NULL;

-- ============================================================
-- 9. 重建主键
-- ============================================================
ALTER TABLE "user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");
ALTER TABLE "department" ADD CONSTRAINT "department_pkey" PRIMARY KEY ("id");
ALTER TABLE "sync_log" ADD CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id");
ALTER TABLE "role" ADD CONSTRAINT "role_pkey" PRIMARY KEY ("id");
ALTER TABLE "permission" ADD CONSTRAINT "permission_pkey" PRIMARY KEY ("id");
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id");
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("id");
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id");
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");
ALTER TABLE "notification" ADD CONSTRAINT "notification_pkey" PRIMARY KEY ("id");
ALTER TABLE "file" ADD CONSTRAINT "file_pkey" PRIMARY KEY ("id");
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("id");
ALTER TABLE "field_config" ADD CONSTRAINT "field_config_pkey" PRIMARY KEY ("id");
ALTER TABLE "mcp_tool" ADD CONSTRAINT "mcp_tool_pkey" PRIMARY KEY ("id");
ALTER TABLE "mcp_session" ADD CONSTRAINT "mcp_session_pkey" PRIMARY KEY ("id");
ALTER TABLE "mcp_tool_log" ADD CONSTRAINT "mcp_tool_log_pkey" PRIMARY KEY ("id");
ALTER TABLE "scheduler_config" ADD CONSTRAINT "scheduler_config_pkey" PRIMARY KEY ("id");
ALTER TABLE "scheduler_run" ADD CONSTRAINT "scheduler_run_pkey" PRIMARY KEY ("id");
ALTER TABLE "badge" ADD CONSTRAINT "badge_pkey" PRIMARY KEY ("id");
ALTER TABLE "recognition" ADD CONSTRAINT "recognition_pkey" PRIMARY KEY ("id");
ALTER TABLE "recognition_like" ADD CONSTRAINT "recognition_like_pkey" PRIMARY KEY ("id");
ALTER TABLE "coin_account" ADD CONSTRAINT "coin_account_pkey" PRIMARY KEY ("id");
ALTER TABLE "coin_transaction" ADD CONSTRAINT "coin_transaction_pkey" PRIMARY KEY ("id");
ALTER TABLE "stamina_account" ADD CONSTRAINT "stamina_account_pkey" PRIMARY KEY ("id");
ALTER TABLE "product" ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");
ALTER TABLE "exchange_order" ADD CONSTRAINT "exchange_order_pkey" PRIMARY KEY ("id");
ALTER TABLE "md_doc" ADD CONSTRAINT "md_doc_pkey" PRIMARY KEY ("id");
ALTER TABLE "md_doc_image" ADD CONSTRAINT "md_doc_image_pkey" PRIMARY KEY ("id");

-- ============================================================
-- 10. 重建外键
-- ============================================================
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "file" ADD CONSTRAINT "file_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mcp_session" ADD CONSTRAINT "mcp_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcp_tool_log" ADD CONSTRAINT "mcp_tool_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduler_run" ADD CONSTRAINT "scheduler_run_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "scheduler_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recognition" ADD CONSTRAINT "recognition_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recognition" ADD CONSTRAINT "recognition_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recognition" ADD CONSTRAINT "recognition_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recognition_like" ADD CONSTRAINT "recognition_like_recognition_id_fkey" FOREIGN KEY ("recognition_id") REFERENCES "recognition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recognition_like" ADD CONSTRAINT "recognition_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coin_account" ADD CONSTRAINT "coin_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "coin_transaction" ADD CONSTRAINT "coin_transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "coin_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stamina_account" ADD CONSTRAINT "stamina_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchange_order" ADD CONSTRAINT "exchange_order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exchange_order" ADD CONSTRAINT "exchange_order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "md_doc" ADD CONSTRAINT "md_doc_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "md_doc_image" ADD CONSTRAINT "md_doc_image_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "md_doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "md_doc_image" ADD CONSTRAINT "md_doc_image_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 11. 重建索引与唯一约束
-- ============================================================
CREATE INDEX "auth_session_user_id_status_idx" ON "auth_session"("user_id", "status");
CREATE INDEX "audit_log_user_id_created_at_idx" ON "audit_log"("user_id", "created_at");
CREATE INDEX "coin_transaction_account_id_created_at_idx" ON "coin_transaction"("account_id", "created_at");
CREATE INDEX "exchange_order_user_id_status_idx" ON "exchange_order"("user_id", "status");
CREATE INDEX "md_doc_author_id_idx" ON "md_doc"("author_id");
CREATE INDEX "md_doc_image_doc_id_idx" ON "md_doc_image"("doc_id");
CREATE INDEX "mcp_session_user_id_client_name_status_idx" ON "mcp_session"("user_id", "client_name", "status");
CREATE INDEX "notification_user_id_status_idx" ON "notification"("user_id", "status");
CREATE INDEX "recognition_receiver_id_status_idx" ON "recognition"("receiver_id", "status");
CREATE INDEX "scheduler_run_config_id_status_scheduled_at_idx" ON "scheduler_run"("config_id", "status", "scheduled_at");
CREATE UNIQUE INDEX "recognition_like_recognition_id_user_id_key" ON "recognition_like"("recognition_id", "user_id");
CREATE UNIQUE INDEX "role_permission_role_id_permission_id_key" ON "role_permission"("role_id", "permission_id");
CREATE UNIQUE INDEX "user_role_user_id_role_id_key" ON "user_role"("user_id", "role_id");
