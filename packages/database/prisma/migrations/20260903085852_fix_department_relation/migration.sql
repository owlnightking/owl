-- DropForeignKey
ALTER TABLE "department" DROP CONSTRAINT "department_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_department_id_fkey";

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("feishu_department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "department"("feishu_department_id") ON DELETE SET NULL ON UPDATE CASCADE;
