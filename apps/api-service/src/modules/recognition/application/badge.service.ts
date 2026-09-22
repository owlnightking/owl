import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  BADGE_REPOSITORY,
  type BadgeCreateInput,
  type BadgeItem,
  type BadgeRepositoryPort,
  type BadgeUpdateInput,
} from "../domain/badge.ports";

@Injectable()
export class BadgeService {
  constructor(@Inject(BADGE_REPOSITORY) private readonly repo: BadgeRepositoryPort) {}

  async list(): Promise<BadgeItem[]> {
    return this.repo.list();
  }

  async findById(id: number): Promise<BadgeItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`badge ${id} not found`);
    return item;
  }

  async create(input: BadgeCreateInput): Promise<BadgeItem> {
    return this.repo.create(input);
  }

  async update(id: number, input: BadgeUpdateInput): Promise<BadgeItem> {
    const item = await this.repo.update(id, input);
    if (!item) throw new NotFoundException(`badge ${id} not found`);
    return item;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
