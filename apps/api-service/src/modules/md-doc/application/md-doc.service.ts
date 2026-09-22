import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  MD_DOC_REPOSITORY,
  type MdDocCreateInput,
  type MdDocItem,
  type MdDocListQuery,
  type MdDocRepositoryPort,
  type MdDocUpdateInput,
} from "../domain/md-doc.ports";

const ADMIN_ROLE_CODES = new Set(["super_admin", "admin"]);

@Injectable()
export class MdDocService {
  constructor(@Inject(MD_DOC_REPOSITORY) private readonly repo: MdDocRepositoryPort) {}

  async isAdmin(userId: number): Promise<boolean> {
    const codes = await this.repo.listRoleCodes(userId);
    return codes.some((code) => ADMIN_ROLE_CODES.has(code));
  }

  async uploadImage(
    userId: number,
    file: { originalname: string; mimetype: string; size: number }
  ): Promise<{ url: string; fileId: number }> {
    const ext = file.originalname.split(".").pop() ?? "png";
    const objectKey = `md-docs/${userId}/${Date.now()}.${ext}`;
    const bucket = process.env.MINIO_BUCKET ?? "owl";
    const host = process.env.MINIO_HOST ?? "localhost";
    const port = process.env.MINIO_PORT ?? "9000";
    const url = `http://${host}:${port}/${bucket}/${objectKey}`;
    const fileId = await this.repo.createFileRecord({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      bucket,
      objectKey,
      url,
      uploadedBy: userId,
    });
    return { url, fileId };
  }

  async create(authorId: number, input: MdDocCreateInput): Promise<MdDocItem> {
    return this.repo.create(authorId, input);
  }

  async update(id: number, userId: number, input: MdDocUpdateInput): Promise<void> {
    const isAdmin = await this.isAdmin(userId);
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`document ${id} not found`);
    if (!isAdmin && doc.authorId !== userId) {
      throw new ForbiddenException("no permission to edit this document");
    }
    await this.repo.update(id, input);
  }

  async delete(id: number, userId: number): Promise<void> {
    const isAdmin = await this.isAdmin(userId);
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`document ${id} not found`);
    if (!isAdmin && doc.authorId !== userId) {
      throw new ForbiddenException("no permission to delete this document");
    }
    await this.repo.delete(id);
  }

  async list(userId: number, query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }> {
    const isAdmin = await this.isAdmin(userId);
    if (isAdmin) {
      return this.repo.listAll(query);
    }
    return this.repo.listByAuthor(userId, query);
  }

  async findById(id: number, userId: number): Promise<MdDocItem> {
    const isAdmin = await this.isAdmin(userId);
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`document ${id} not found`);
    if (!isAdmin && doc.authorId !== userId) {
      throw new ForbiddenException("no permission to view this document");
    }
    return doc;
  }
}
