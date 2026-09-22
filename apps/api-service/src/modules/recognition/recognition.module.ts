import { Module } from "@nestjs/common";
import { BadgeController } from "./presentation/badge.controller";
import { RecognitionController } from "./presentation/recognition.controller";
import { ProductController } from "./presentation/product.controller";
import { ExchangeController } from "./presentation/exchange.controller";
import { BadgeService } from "./application/badge.service";
import { RecognitionService } from "./application/recognition.service";
import { CoinService } from "./application/coin.service";
import { StaminaService } from "./application/stamina.service";
import { ProductService } from "./application/product.service";
import { ExchangeService } from "./application/exchange.service";
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
    { provide: BADGE_SERVICE, useClass: BadgeService },
    { provide: RECOGNITION_REPOSITORY, useClass: PrismaRecognitionRepository },
    { provide: RECOGNITION_SERVICE, useClass: RecognitionService },
    { provide: COIN_REPOSITORY, useClass: PrismaCoinRepository },
    { provide: COIN_SERVICE, useClass: CoinService },
    { provide: STAMINA_REPOSITORY, useClass: PrismaStaminaRepository },
    { provide: STAMINA_SERVICE, useClass: StaminaService },
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    { provide: PRODUCT_SERVICE, useClass: ProductService },
    { provide: EXCHANGE_REPOSITORY, useClass: PrismaExchangeRepository },
    { provide: EXCHANGE_SERVICE, useClass: ExchangeService },
  ],
  exports: [COIN_SERVICE, STAMINA_SERVICE, RECOGNITION_SERVICE],
})
export class RecognitionModule {}
