import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  MD_DOC_REPOSITORY,
  type MdDocCollaboratorItem,
  type MdDocCreateInput,
  type MdDocItem,
  type MdDocListQuery,
  type MdDocRepositoryPort,
  type MdDocUpdateInput,
  type MdDocUserOption,
} from "../domain/md-doc.ports";

@Injectable()
export class MdDocService {
  constructor(@Inject(MD_DOC_REPOSITORY) private readonly repo: MdDocRepositoryPort) {}

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
    const doc = await this.requireDoc(id);
    this.assertCanView(doc, userId);
    await this.repo.update(id, input, userId);
  }

  async delete(id: number, userId: number): Promise<void> {
    const doc = await this.requireDoc(id);
    this.assertOwner(doc, userId);
    await this.repo.delete(id);
  }

  async list(userId: number, query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }> {
    return this.repo.listAccessible(userId, query);
  }

  async findById(id: number, userId: number): Promise<MdDocItem> {
    const doc = await this.requireDoc(id);
    this.assertCanView(doc, userId);
    return doc;
  }

  async listCollaborators(id: number, userId: number): Promise<MdDocCollaboratorItem[]> {
    const doc = await this.requireDoc(id);
    this.assertCanView(doc, userId);
    return doc.collaborators;
  }

  async setCollaborators(id: number, userId: number, userIds: number[]): Promise<MdDocCollaboratorItem[]> {
    const doc = await this.requireDoc(id);
    this.assertOwner(doc, userId);

    const unique = [...new Set(userIds)];
    if (unique.includes(doc.authorId)) {
      throw new BadRequestException("owner cannot be added as collaborator");
    }
    const existing = await this.repo.findExistingUserIds(unique);
    const missing = unique.filter((candidate) => !existing.includes(candidate));
    if (missing.length > 0) {
      throw new NotFoundException(`user not found: ${missing.join(",")}`);
    }
    await this.repo.replaceCollaborators(id, unique);
    return this.repo.listCollaborators(id);
  }

  async listUserOptions(keyword?: string): Promise<MdDocUserOption[]> {
    return this.repo.listUserOptions(keyword);
  }

  private async requireDoc(id: number): Promise<MdDocItem> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`document ${id} not found`);
    return doc;
  }

  private assertCanView(doc: MdDocItem, userId: number): void {
    if (doc.authorId === userId) return;
    if (doc.collaborators.some((collaborator) => collaborator.userId === userId)) return;
    throw new ForbiddenException("no permission to view this document");
  }

  private assertOwner(doc: MdDocItem, userId: number): void {
    if (doc.authorId === userId) return;
    throw new ForbiddenException("only the owner can manage this document");
  }
}
