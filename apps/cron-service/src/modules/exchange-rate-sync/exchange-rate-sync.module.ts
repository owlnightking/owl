import { Module } from "@nestjs/common";
import { PrismaClient } from "@owl/database";
import { EXCHANGE_RATE_FETCHER, EXCHANGE_RATE_WRITER } from "./domain/exchange-rate-sync.ports";
import { ExchangeRateSyncService } from "./application/exchange-rate-sync.service";
import { ErApiClient } from "./infrastructure/er-api.client";
import { PrismaExchangeRateWriter } from "./infrastructure/prisma-exchange-rate-writer";

@Module({
  providers: [
    ExchangeRateSyncService,
    { provide: EXCHANGE_RATE_FETCHER, useClass: ErApiClient },
    {
      provide: EXCHANGE_RATE_WRITER,
      useFactory: (prisma: PrismaClient) => new PrismaExchangeRateWriter(prisma),
      inject: [PrismaClient],
    },
  ],
  exports: [ExchangeRateSyncService],
})
export class ExchangeRateSyncModule {}
