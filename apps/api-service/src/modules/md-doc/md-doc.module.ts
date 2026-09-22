import { Module } from "@nestjs/common";
import { MdDocController } from "./presentation/md-doc.controller";
import { MdDocService } from "./application/md-doc.service";
import { PrismaMdDocRepository } from "./infrastructure/prisma-md-doc.repository";
import { MD_DOC_REPOSITORY, MD_DOC_SERVICE } from "./domain/md-doc.ports";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [MdDocController],
  providers: [
    { provide: MD_DOC_REPOSITORY, useClass: PrismaMdDocRepository },
    { provide: MD_DOC_SERVICE, useClass: MdDocService },
  ],
  exports: [MD_DOC_SERVICE],
})
export class MdDocModule {}
