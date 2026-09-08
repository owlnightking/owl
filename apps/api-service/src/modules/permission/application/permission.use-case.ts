import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  PERMISSION_REPOSITORY,
  type PermissionCreateInput,
  type PermissionItem,
  type PermissionRepositoryPort,
  type PermissionUpdateInput,
} from "../domain/permission.ports";

@Injectable()
export class PermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly repo: PermissionRepositoryPort
  ) {}

  async list(): Promise<PermissionItem[]> {
    return this.repo.list();
  }

  async findById(id: string): Promise<PermissionItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException(`permission ${id} not found`);
    return item;
  }

  async create(input: PermissionCreateInput): Promise<PermissionItem> {
    const existing = await this.repo.findByCode(input.code);
    if (existing) throw new ConflictException(`permission code "${input.code}" already exists`);
    return this.repo.create(input);
  }

  async update(id: string, input: PermissionUpdateInput): Promise<PermissionItem> {
    const item = await this.repo.update(id, input);
    if (!item) throw new NotFoundException(`permission ${id} not found`);
    return item;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
