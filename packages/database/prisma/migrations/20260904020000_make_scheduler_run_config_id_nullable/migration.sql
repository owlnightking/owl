-- DropForeignKey
ALTER TABLE "scheduler_run" DROP CONSTRAINT "scheduler_run_config_id_fkey";

-- AlterTable
ALTER TABLE "scheduler_run" ALTER COLUMN "config_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "scheduler_run" ADD CONSTRAINT "scheduler_run_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "scheduler_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;