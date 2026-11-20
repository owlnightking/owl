-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_user_id_fkey";

-- AlterTable
ALTER TABLE "permission" ADD COLUMN     "app" TEXT,
ADD COLUMN     "parent_id" INTEGER,
ADD COLUMN     "path" TEXT,
ADD COLUMN     "sort" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'button';

-- CreateTable
CREATE TABLE "user_group" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "user_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group_member" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "user_group_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_group" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "role_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_group_code_key" ON "user_group"("code");

-- CreateIndex
CREATE INDEX "user_group_member_user_id_idx" ON "user_group_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_group_member_group_id_user_id_key" ON "user_group_member"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "role_group_group_id_idx" ON "role_group"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_group_role_id_group_id_key" ON "role_group"("role_id", "group_id");

-- CreateIndex
CREATE INDEX "permission_parent_id_idx" ON "permission"("parent_id");

-- CreateIndex
CREATE INDEX "permission_app_type_idx" ON "permission"("app", "type");

-- AddForeignKey
ALTER TABLE "user_group_member" ADD CONSTRAINT "user_group_member_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_member" ADD CONSTRAINT "user_group_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_group" ADD CONSTRAINT "role_group_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_group" ADD CONSTRAINT "role_group_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "permission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: 把「用户直连角色」转为「用户组 → 角色」，保留既有授权
INSERT INTO "user_group" ("code", "name", "description", "is_system", "created_at", "updated_at")
SELECT 'legacy_' || r."code", r."name" || '（历史直连）', '由 user_role 迁移，可在确认后删除', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "role" r
WHERE r."deleted_at" IS NULL
  AND EXISTS (SELECT 1 FROM "user_role" ur WHERE ur."role_id" = r."id" AND ur."deleted_at" IS NULL)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_group" ("role_id", "group_id", "created_at", "updated_at")
SELECT r."id", g."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "role" r
JOIN "user_group" g ON g."code" = 'legacy_' || r."code"
WHERE r."deleted_at" IS NULL
ON CONFLICT ("role_id", "group_id") DO NOTHING;

INSERT INTO "user_group_member" ("group_id", "user_id", "created_at", "updated_at")
SELECT g."id", ur."user_id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "user_role" ur
JOIN "role" r ON r."id" = ur."role_id"
JOIN "user_group" g ON g."code" = 'legacy_' || r."code"
WHERE ur."deleted_at" IS NULL
  AND r."deleted_at" IS NULL
ON CONFLICT ("group_id", "user_id") DO NOTHING;

-- DropTable
DROP TABLE "user_role";
