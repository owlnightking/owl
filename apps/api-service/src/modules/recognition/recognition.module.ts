import { Module } from "@nestjs/common";
import { BadgeController } from "./presentation/badge.controller";
import { RecognitionController } from "./presentation/recognition.controller";
import { ProductController } from "./presentation/product.controller";
import { ExchangeController } from "./presentation/exchange.controller";
import { BadgeUseCase } from "./application/badge.use-case";
import { RecognitionUseCase } from "./application/recognition.use-case";
import { CoinUseCase } from "./application/coin.use-case";
import { StaminaUseCase } from "./application/stamina.use-case";
import { ProductUseCase } from "./application/product.use-case";
import { ExchangeUseCase } from "./application/exchange.use-case";
import { PrismaBadgeRepository } from "./infrastructure/prisma-badge.repository";
import { PrismaRecognitionRepository } from "./infrastructure/prisma-recognition.repository";
import { PrismaCoinRepository } from "./infrastructure/prisma-coin.repository";
import { PrismaStaminaRepository } from "./infrastructure/prisma-stamina.repository";
import { PrismaProductRepository } from "./infrastructure/prisma-product.repository";
import { PrismaExchangeRepository } from "./infrastructure/prisma-exchange.repository";
import { BADGE_REPOSITORY, BADGE_SERVICE } from "./domain/badge.ports";
import { RECOGNITION_REPOSITORY, RECOGNITION_SERVICE } from "./domain/recognition.ports";
import { COIN_REPOSITORY, COIN_SERVICE } from "./domain/coin.ports";
import { STAMINA_REPOSITORY, STAMINA_SERVICE } from "./domain/stamina.ports";
import { PRODUCT_REPOSITORY, PRODUCT_SERVICE } from "./domain/product.ports";
import { EXCHANGE_REPOSITORY, EXCHANGE_SERVICE } from "./domain/exchange.ports";
import { AuthModule } from "../auth/auth.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [BadgeController, RecognitionController, ProductController, ExchangeController],
  providers: [
    { provide: BADGE_REPOSITORY, useClass: PrismaBadgeRepository },
    { provide: BADGE_SERVICE, useClass: BadgeUseCase },
    { provide: RECOGNITION_REPOSITORY, useClass: PrismaRecognitionRepository },
    { provide: RECOGNITION_SERVICE, useClass: RecognitionUseCase },
    { provide: COIN_REPOSITORY, useClass: PrismaCoinRepository },
    { provide: COIN_SERVICE, useClass: CoinUseCase },
    { provide: STAMINA_REPOSITORY, useClass: PrismaStaminaRepository },
    { provide: STAMINA_SERVICE, useClass: StaminaUseCase },
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    { provide: PRODUCT_SERVICE, useClass: ProductUseCase },
    { provide: EXCHANGE_REPOSITORY, useClass: PrismaExchangeRepository },
    { provide: EXCHANGE_SERVICE, useClass: ExchangeUseCase },
  ],
  exports: [COIN_SERVICE, STAMINA_SERVICE, RECOGNITION_SERVICE],
})
export class RecognitionModule {}
