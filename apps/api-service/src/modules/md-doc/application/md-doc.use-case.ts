import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  MD_DOC_REPOSITORY,
  type MdDocCreateInput,
  type MdDocItem,
  type MdDocListQuery,
  type MdDocRepositoryPort,
  type MdDocUpdateInput,
} from "../domain/md-doc.ports";

@Injectable()
export class MdDocUseCase {
  constructor(@Inject(MD_DOC_REPOSITORY) private readonly repo: MdDocRepositoryPort) {}

  async create(authorId: string, input: MdDocCreateInput): Promise<MdDocItem> {
    return this.repo.create(authorId, input);
  }

  async update(id: string, userId: string, isAdmin: boolean, input: MdDocUpdateInput): Promise<void> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`document ${id} not found`);
    if (!isAdmin && doc.authorId !== userId) {
      throw new ForbiddenException("no permission to edit this document");
    }
    await this.repo.update(id, input);
  }

  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`document ${id} not found`);
    if (!isAdmin && doc.authorId !== userId) {
      throw new ForbiddenException("no permission to delete this document");
    }
    await this.repo.delete(id);
  }

  async list(userId: string, isAdmin: boolean, query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }> {
    if (isAdmin) {
      return this.repo.listAll(query);
    }
    return this.repo.listByAuthor(userId, query);
  }

  async findById(id: string, userId: string, isAdmin: boolean): Promise<MdDocItem> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException(`document ${id} not found`);
    if (!isAdmin && doc.authorId !== userId) {
      throw new ForbiddenException("no permission to view this document");
    }
    return doc;
  }
}
