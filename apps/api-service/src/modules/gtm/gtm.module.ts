import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { IpdModule } from "../ipd/ipd.module";
import { GTM_REPOSITORY, CAMPAIGN_SERVICE, KOL_SERVICE, FEEDBACK_SERVICE, PRESALE_SERVICE } from "./domain/gtm.ports";
import { CampaignService, FeedbackService, KolService, PresaleService } from "./application/gtm.service";
import { PrismaGtmRepository } from "./infrastructure/prisma-gtm.repository";
import {
  CampaignController,
  FeedbackController,
  KolController,
  PresaleController,
} from "./presentation/gtm.controller";

@Module({
  imports: [AuthModule, IpdModule],
  controllers: [CampaignController, KolController, FeedbackController, PresaleController],
  providers: [
    { provide: GTM_REPOSITORY, useClass: PrismaGtmRepository },
    { provide: CAMPAIGN_SERVICE, useClass: CampaignService },
    { provide: KOL_SERVICE, useClass: KolService },
    { provide: FEEDBACK_SERVICE, useClass: FeedbackService },
    { provide: PRESALE_SERVICE, useClass: PresaleService },
  ],
})
export class GtmModule {}
