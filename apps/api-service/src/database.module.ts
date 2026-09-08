import { Global, Module } from "@nestjs/common";
import { DatabaseProvider } from "@owl/database/provider";

@Global()
@Module({
  providers: [DatabaseProvider],
  exports: [DatabaseProvider],
})
export class DatabaseModule {}
