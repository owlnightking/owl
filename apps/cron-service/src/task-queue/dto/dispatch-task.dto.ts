import { IsObject, IsOptional, IsString } from "class-validator";

export class DispatchTaskDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  task?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  get resolvedTask(): string {
    return this.name ?? this.task ?? "";
  }
}
