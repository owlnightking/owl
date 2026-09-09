-- CreateTable
CREATE TABLE "md_doc" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "md_doc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "md_doc_image" (
    "id" TEXT NOT NULL,
    "doc_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "md_doc_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "md_doc_author_id_idx" ON "md_doc"("author_id");

-- CreateIndex
CREATE INDEX "md_doc_image_doc_id_idx" ON "md_doc_image"("doc_id");

-- AddForeignKey
ALTER TABLE "md_doc" ADD CONSTRAINT "md_doc_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_doc_image" ADD CONSTRAINT "md_doc_image_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "md_doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "md_doc_image" ADD CONSTRAINT "md_doc_image_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
