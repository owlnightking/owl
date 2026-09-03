import { Global, Module } from "@nestjs/common";
import { PrismaClient } from "@owl/database";

const databaseProvider = {
  provide: PrismaClient,
  useFactory: () => new PrismaClient(),
};

@Global()
@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class PrismaModule {}
