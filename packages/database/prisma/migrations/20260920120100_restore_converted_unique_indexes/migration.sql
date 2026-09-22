-- 补回 uuid->int 列替换时丢失的唯一索引
CREATE UNIQUE INDEX "coin_account_user_id_key" ON "coin_account"("user_id");
CREATE UNIQUE INDEX "stamina_account_user_id_key" ON "stamina_account"("user_id");
