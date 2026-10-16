import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EXCHANGE_RATE_REPOSITORY, EXCHANGE_RATE_SERVICE } from "./domain/exchange-rate.ports";
import { ExchangeRateService } from "./application/exchange-rate.service";
import { PrismaExchangeRateRepository } from "./infrastructure/prisma-exchange-rate.repository";
import { ExchangeRateController } from "./presentation/exchange-rate.controller";

@Module({
  imports: [AuthModule],
  controllers: [ExchangeRateController],
  providers: [
    { provide: EXCHANGE_RATE_REPOSITORY, useClass: PrismaExchangeRateRepository },
    { provide: EXCHANGE_RATE_SERVICE, useClass: ExchangeRateService },
  ],
  exports: [EXCHANGE_RATE_SERVICE],
})
export class ExchangeRateModule {}
