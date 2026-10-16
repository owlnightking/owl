import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ExchangeRateModule } from "../exchange-rate/exchange-rate.module";
import { IpdModule } from "../ipd/ipd.module";
import { ISC_REPOSITORY, SUPPLIER_SERVICE, PRODUCTION_SERVICE, SHIPMENT_SERVICE } from "./domain/isc.ports";
import { ProductionService, ShipmentService, SupplierService } from "./application/isc.service";
import { PrismaIscRepository } from "./infrastructure/prisma-isc.repository";
import { ProductionController, ShipmentController, SupplierController } from "./presentation/isc.controller";

@Module({
  imports: [AuthModule, ExchangeRateModule, IpdModule],
  controllers: [SupplierController, ProductionController, ShipmentController],
  providers: [
    { provide: ISC_REPOSITORY, useClass: PrismaIscRepository },
    { provide: SUPPLIER_SERVICE, useClass: SupplierService },
    { provide: PRODUCTION_SERVICE, useClass: ProductionService },
    { provide: SHIPMENT_SERVICE, useClass: ShipmentService },
  ],
})
export class IscModule {}
