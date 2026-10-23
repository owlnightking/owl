-- AlterTable
ALTER TABLE "md_doc" ADD COLUMN "updated_by" INTEGER;

-- Backfill last updater with the original author (no rows are deleted)
UPDATE "md_doc" SET "updated_by" = "author_id" WHERE "updated_by" IS NULL;

-- CreateTable
CREATE TABLE "md_doc_collaborator" (
    "id" SERIAL NOT NULL,
    "doc_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "md_doc_collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "md_doc_updated_by_idx" ON "md_doc"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "md_doc_collaborator_doc_id_user_id_key" ON "md_doc_collaborator"("doc_id", "user_id");

-- CreateIndex
CREATE INDEX "md_doc_collaborator_doc_id_idx" ON "md_doc_collaborator"("doc_id");

-- CreateIndex
CREATE INDEX "md_doc_collaborator_user_id_idx" ON "md_doc_collaborator"("user_id");

-- AddForeignKey
ALTER TABLE "md_doc" ADD CONSTRAINT "md_doc_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_doc_collaborator" ADD CONSTRAINT "md_doc_collaborator_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "md_doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_doc_collaborator" ADD CONSTRAINT "md_doc_collaborator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
