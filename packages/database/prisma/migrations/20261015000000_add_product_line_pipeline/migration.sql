-- CreateTable
CREATE TABLE "product_line" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "style_desc" TEXT,
    "ipd_stage" TEXT NOT NULL DEFAULT 'opportunity',
    "lifecycle_stage" TEXT NOT NULL DEFAULT 'incubating',
    "target_market" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "product_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spu" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "internal_code" TEXT NOT NULL,
    "spu_code" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "launch_at" TIMESTAMP(0),
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "spu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sku" (
    "id" SERIAL NOT NULL,
    "spu_id" INTEGER NOT NULL,
    "sku_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "limited" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipd_research" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "source_ref" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "ipd_research_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_task" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feasible" BOOLEAN,
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "design_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prototype_review" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "sample_ready" BOOLEAN NOT NULL DEFAULT false,
    "review_passed" BOOLEAN NOT NULL DEFAULT false,
    "review_notes" TEXT,
    "shared_with_gtm" BOOLEAN NOT NULL DEFAULT false,
    "shared_at" TIMESTAMP(0),
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "prototype_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invest_decision" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "gtm_feedback_summary" TEXT,
    "isc_summary" TEXT,
    "target_price_usd" DECIMAL(18,2),
    "unit_cost_usd" DECIMAL(18,2),
    "result" TEXT NOT NULL DEFAULT 'pending',
    "decided_at" TIMESTAMP(0),
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "invest_decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roi_review" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "sales_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ad_cost_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "product_cost_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "fulfillment_cost_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "refund_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "after_sale_cost_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "roi" DECIMAL(18,4),
    "decision" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "roi_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gtm_campaign" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'tiktok',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "kol_id" INTEGER,
    "budget_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "spent_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feedback_notes" TEXT,
    "start_date" TIMESTAMP(0),
    "end_date" TIMESTAMP(0),
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "gtm_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kol" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'tiktok',
    "handle" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "coop_status" TEXT NOT NULL DEFAULT 'contacting',
    "contact_info" TEXT,
    "total_spent_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cooperation_notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "kol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_feedback" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "collected_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "community_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presale_batch" (
    "id" SERIAL NOT NULL,
    "spu_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "limited" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price_usd" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "start_at" TIMESTAMP(0),
    "end_at" TIMESTAMP(0),
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),
    "product_line_id" INTEGER NOT NULL,

    CONSTRAINT "presale_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "region" TEXT,
    "coop_status" TEXT NOT NULL DEFAULT 'potential',
    "capability" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_quote" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "product_line_id" INTEGER,
    "spu_id" INTEGER,
    "item_name" TEXT NOT NULL,
    "amount_cny" DECIMAL(18,2) NOT NULL,
    "exchange_rate" DECIMAL(18,6) NOT NULL,
    "amount_usd" DECIMAL(18,2) NOT NULL,
    "quoted_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "supplier_quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_batch" (
    "id" SERIAL NOT NULL,
    "spu_id" INTEGER NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "planned_at" TIMESTAMP(0),
    "completed_at" TIMESTAMP(0),
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "production_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_order" (
    "id" SERIAL NOT NULL,
    "product_line_id" INTEGER NOT NULL,
    "spu_id" INTEGER,
    "supplier_id" INTEGER,
    "mode" TEXT NOT NULL,
    "warehouse" TEXT NOT NULL DEFAULT 'tiktok_us',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tracking_ref" TEXT,
    "cost_cny" DECIMAL(18,2),
    "exchange_rate" DECIMAL(18,6),
    "cost_usd" DECIMAL(18,2),
    "eta_date" TIMESTAMP(0),
    "received_at" TIMESTAMP(0),
    "notes" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "shipment_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voc_ticket" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "product_line_id" INTEGER,
    "spu_id" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "status" TEXT NOT NULL DEFAULT 'new',
    "handled_note" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "voc_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate" (
    "id" SERIAL NOT NULL,
    "base" TEXT NOT NULL DEFAULT 'CNY',
    "quote" TEXT NOT NULL DEFAULT 'USD',
    "rate" DECIMAL(18,6) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "effective_date" TIMESTAMP(0) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "exchange_rate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_line_code_key" ON "product_line"("code");

-- CreateIndex
CREATE INDEX "product_line_ipd_stage_idx" ON "product_line"("ipd_stage");

-- CreateIndex
CREATE INDEX "product_line_lifecycle_stage_idx" ON "product_line"("lifecycle_stage");

-- CreateIndex
CREATE UNIQUE INDEX "spu_internal_code_key" ON "spu"("internal_code");

-- CreateIndex
CREATE UNIQUE INDEX "spu_spu_code_key" ON "spu"("spu_code");

-- CreateIndex
CREATE INDEX "spu_product_line_id_idx" ON "spu"("product_line_id");

-- CreateIndex
CREATE INDEX "spu_status_idx" ON "spu"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sku_sku_code_key" ON "sku"("sku_code");

-- CreateIndex
CREATE INDEX "sku_spu_id_idx" ON "sku"("spu_id");

-- CreateIndex
CREATE INDEX "ipd_research_product_line_id_idx" ON "ipd_research"("product_line_id");

-- CreateIndex
CREATE INDEX "design_task_product_line_id_idx" ON "design_task"("product_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "prototype_review_product_line_id_key" ON "prototype_review"("product_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "invest_decision_product_line_id_key" ON "invest_decision"("product_line_id");

-- CreateIndex
CREATE INDEX "roi_review_product_line_id_phase_idx" ON "roi_review"("product_line_id", "phase");

-- CreateIndex
CREATE INDEX "gtm_campaign_product_line_id_idx" ON "gtm_campaign"("product_line_id");

-- CreateIndex
CREATE INDEX "gtm_campaign_platform_status_idx" ON "gtm_campaign"("platform", "status");

-- CreateIndex
CREATE INDEX "kol_platform_coop_status_idx" ON "kol"("platform", "coop_status");

-- CreateIndex
CREATE INDEX "community_feedback_product_line_id_type_idx" ON "community_feedback"("product_line_id", "type");

-- CreateIndex
CREATE INDEX "presale_batch_spu_id_idx" ON "presale_batch"("spu_id");

-- CreateIndex
CREATE INDEX "presale_batch_product_line_id_idx" ON "presale_batch"("product_line_id");

-- CreateIndex
CREATE INDEX "supplier_quote_supplier_id_idx" ON "supplier_quote"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_quote_product_line_id_idx" ON "supplier_quote"("product_line_id");

-- CreateIndex
CREATE INDEX "production_batch_spu_id_idx" ON "production_batch"("spu_id");

-- CreateIndex
CREATE INDEX "production_batch_supplier_id_idx" ON "production_batch"("supplier_id");

-- CreateIndex
CREATE INDEX "shipment_order_product_line_id_idx" ON "shipment_order"("product_line_id");

-- CreateIndex
CREATE INDEX "shipment_order_status_idx" ON "shipment_order"("status");

-- CreateIndex
CREATE INDEX "voc_ticket_source_status_idx" ON "voc_ticket"("source", "status");

-- CreateIndex
CREATE INDEX "voc_ticket_product_line_id_idx" ON "voc_ticket"("product_line_id");

-- CreateIndex
CREATE INDEX "exchange_rate_base_quote_effective_date_idx" ON "exchange_rate"("base", "quote", "effective_date");

-- AddForeignKey
ALTER TABLE "spu" ADD CONSTRAINT "spu_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku" ADD CONSTRAINT "sku_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "spu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipd_research" ADD CONSTRAINT "ipd_research_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_task" ADD CONSTRAINT "design_task_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prototype_review" ADD CONSTRAINT "prototype_review_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invest_decision" ADD CONSTRAINT "invest_decision_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roi_review" ADD CONSTRAINT "roi_review_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gtm_campaign" ADD CONSTRAINT "gtm_campaign_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gtm_campaign" ADD CONSTRAINT "gtm_campaign_kol_id_fkey" FOREIGN KEY ("kol_id") REFERENCES "kol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_feedback" ADD CONSTRAINT "community_feedback_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presale_batch" ADD CONSTRAINT "presale_batch_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "spu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presale_batch" ADD CONSTRAINT "presale_batch_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quote" ADD CONSTRAINT "supplier_quote_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quote" ADD CONSTRAINT "supplier_quote_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quote" ADD CONSTRAINT "supplier_quote_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "spu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "spu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batch" ADD CONSTRAINT "production_batch_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_order" ADD CONSTRAINT "shipment_order_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_order" ADD CONSTRAINT "shipment_order_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "spu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_order" ADD CONSTRAINT "shipment_order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voc_ticket" ADD CONSTRAINT "voc_ticket_product_line_id_fkey" FOREIGN KEY ("product_line_id") REFERENCES "product_line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voc_ticket" ADD CONSTRAINT "voc_ticket_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "spu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

