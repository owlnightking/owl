import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { IpdModule } from "../ipd/ipd.module";
import { VOC_REPOSITORY, VOC_SERVICE } from "./domain/voc.ports";
import { VocService } from "./application/voc.service";
import { PrismaVocRepository } from "./infrastructure/prisma-voc.repository";
import { VocController } from "./presentation/voc.controller";

@Module({
  imports: [AuthModule, IpdModule],
  controllers: [VocController],
  providers: [
    { provide: VOC_REPOSITORY, useClass: PrismaVocRepository },
    { provide: VOC_SERVICE, useClass: VocService },
  ],
})
export class VocModule {}
