import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { FILE_REPOSITORY, type FileItem, type FileRepositoryPort } from "../domain/file.ports";
import { OBJECT_STORAGE, type ObjectStoragePort } from "../domain/object-storage.ports";
import { buildImageObjectKey, DEFAULT_IMAGE_BUCKET, isSupportedImage, MAX_IMAGE_BYTES } from "../domain/file-upload";

export interface UploadImageInput {
  fileName: string;
  mimeType: string;
  size: number;
  body: Buffer;
  uploadedBy: string;
}

@Injectable()
export class FileUseCase {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly repo: FileRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort
  ) {}

  async findById(id: string): Promise<FileItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`file ${id} not found`);
    return item;
  }

  async listByUser(
    userId: string,
    options?: { page: number; pageSize: number }
  ): Promise<{ items: FileItem[]; total: number }> {
    return this.repo.listByUser(userId, options);
  }

  async create(input: {
    name: string;
    mimeType: string;
    size: number;
    bucket: string;
    objectKey: string;
    url?: string;
    uploadedBy: string;
  }): Promise<FileItem> {
    return this.repo.create(input);
  }

  async uploadImage(input: UploadImageInput): Promise<FileItem> {
    if (!isSupportedImage(input.mimeType)) {
      throw new BadRequestException("仅支持 JPG / PNG / WebP / GIF 图片");
    }
    if (input.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException("图片大小超出上限");
    }

    const bucket = process.env.MINIO_BUCKET_IMAGES ?? DEFAULT_IMAGE_BUCKET;
    const objectKey = buildImageObjectKey(input.uploadedBy, input.mimeType);
    await this.storage.putObject(bucket, {
      objectKey,
      body: input.body,
      contentType: input.mimeType,
      size: input.size,
    });

    return this.repo.create({
      name: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      bucket,
      objectKey,
      url: this.storage.buildPublicUrl(bucket, objectKey),
      uploadedBy: input.uploadedBy,
    });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
