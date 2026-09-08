import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  BADGE_REPOSITORY,
  type BadgeCreateInput,
  type BadgeItem,
  type BadgeRepositoryPort,
  type BadgeUpdateInput,
} from "../domain/badge.ports";

@Injectable()
export class BadgeUseCase {
  constructor(@Inject(BADGE_REPOSITORY) private readonly repo: BadgeRepositoryPort) {}

  async list(): Promise<BadgeItem[]> {
    return this.repo.list();
  }

  async findById(id: string): Promise<BadgeItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`badge ${id} not found`);
    return item;
  }

  async create(input: BadgeCreateInput): Promise<BadgeItem> {
    return this.repo.create(input);
  }

  async update(id: string, input: BadgeUpdateInput): Promise<BadgeItem> {
    const item = await this.repo.update(id, input);
    if (!item) throw new NotFoundException(`badge ${id} not found`);
    return item;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
