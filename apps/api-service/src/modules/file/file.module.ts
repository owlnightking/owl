import { Module } from "@nestjs/common";
import { FileUseCase } from "./application/file.use-case";
import { FileController } from "./presentation/file.controller";
import { PrismaFileRepository } from "./infrastructure/prisma-file.repository";
import { MinioObjectStorage } from "./infrastructure/minio-object-storage";
import { FILE_REPOSITORY, FILE_SERVICE } from "./domain/file.ports";
import { OBJECT_STORAGE } from "./domain/object-storage.ports";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [FileController],
  providers: [
    { provide: FILE_REPOSITORY, useClass: PrismaFileRepository },
    { provide: OBJECT_STORAGE, useClass: MinioObjectStorage },
    { provide: FILE_SERVICE, useClass: FileUseCase },
  ],
  exports: [FILE_SERVICE],
})
export class FileModule {}
