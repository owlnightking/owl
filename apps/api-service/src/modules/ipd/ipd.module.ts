import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PRODUCT_LINE_REPOSITORY, PRODUCT_LINE_SERVICE } from "./domain/product-line.ports";
import { SPU_REPOSITORY, SPU_SERVICE } from "./domain/spu.ports";
import { IPD_STAGE_REPOSITORY, IPD_STAGE_SERVICE } from "./domain/ipd.ports";
import { ProductLineService } from "./application/product-line.service";
import { SpuService } from "./application/spu.service";
import { IpdStageService } from "./application/ipd-stage.service";
import { PrismaProductLineRepository } from "./infrastructure/prisma-product-line.repository";
import { PrismaSpuRepository } from "./infrastructure/prisma-spu.repository";
import { PrismaIpdStageRepository } from "./infrastructure/prisma-ipd-stage.repository";
import { ProductLineController } from "./presentation/product-line.controller";
import { SpuController } from "./presentation/spu.controller";
import { IpdStageController } from "./presentation/ipd-stage.controller";

@Module({
  imports: [AuthModule],
  controllers: [ProductLineController, SpuController, IpdStageController],
  providers: [
    { provide: PRODUCT_LINE_REPOSITORY, useClass: PrismaProductLineRepository },
    { provide: PRODUCT_LINE_SERVICE, useClass: ProductLineService },
    { provide: SPU_REPOSITORY, useClass: PrismaSpuRepository },
    { provide: SPU_SERVICE, useClass: SpuService },
    { provide: IPD_STAGE_REPOSITORY, useClass: PrismaIpdStageRepository },
    { provide: IPD_STAGE_SERVICE, useClass: IpdStageService },
  ],
  exports: [PRODUCT_LINE_SERVICE, SPU_SERVICE],
})
export class IpdModule {}
