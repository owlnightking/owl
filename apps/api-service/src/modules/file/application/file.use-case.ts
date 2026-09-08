import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { FILE_REPOSITORY, type FileItem, type FileRepositoryPort } from "../domain/file.ports";

@Injectable()
export class FileUseCase {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly repo: FileRepositoryPort
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

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
