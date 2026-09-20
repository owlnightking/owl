import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { FileUseCase } from "./file.use-case";
import type { FileItem, FileRepositoryPort } from "../domain/file.ports";
import type { ObjectStoragePort } from "../domain/object-storage.ports";
import { DEFAULT_IMAGE_BUCKET, MAX_IMAGE_BYTES } from "../domain/file-upload";

const PUBLIC_URL = `http://minio.test/${DEFAULT_IMAGE_BUCKET}/uploads/user-1/icon.png`;
const SAMPLE_IMAGE_SIZE = 1024;

function buildMocks() {
  const repo: FileRepositoryPort = {
    findById: vi.fn(async () => null),
    listByUser: vi.fn(async () => ({ items: [], total: 0 })),
    create: vi.fn(async (input) => ({
      id: "file-1",
      name: input.name,
      mimeType: input.mimeType,
      size: input.size,
      bucket: input.bucket,
      objectKey: input.objectKey,
      url: input.url ?? null,
      uploadedBy: input.uploadedBy,
      createdAt: new Date(),
    })),
    delete: vi.fn(async () => {}),
  };
  const storage: ObjectStoragePort = {
    putObject: vi.fn(async () => {}),
    removeObject: vi.fn(async () => {}),
    buildPublicUrl: vi.fn(() => PUBLIC_URL),
  };
  const useCase = new FileUseCase(repo, storage);
  return { repo, storage, useCase };
}

describe("FileUseCase.uploadImage", () => {
  it("成功路径：写入对象存储并登记文件元数据，返回公开链接", async () => {
    const { repo, storage, useCase } = buildMocks();

    const result: FileItem = await useCase.uploadImage({
      fileName: "icon.png",
      mimeType: "image/png",
      size: SAMPLE_IMAGE_SIZE,
      body: Buffer.from("image-bytes"),
      uploadedBy: "user-1",
    });

    expect(storage.putObject).toHaveBeenCalledWith(
      DEFAULT_IMAGE_BUCKET,
      expect.objectContaining({ contentType: "image/png", size: SAMPLE_IMAGE_SIZE })
    );
    expect(storage.buildPublicUrl).toHaveBeenCalledWith(
      DEFAULT_IMAGE_BUCKET,
      expect.stringContaining("uploads/user-1/")
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: DEFAULT_IMAGE_BUCKET, url: PUBLIC_URL, uploadedBy: "user-1" })
    );
    expect(result.url).toBe(PUBLIC_URL);
  });

  it("失败路径：非图片类型直接拒绝，不写入对象存储", async () => {
    const { repo, storage, useCase } = buildMocks();

    await expect(
      useCase.uploadImage({
        fileName: "note.txt",
        mimeType: "text/plain",
        size: 10,
        body: Buffer.from("hello"),
        uploadedBy: "user-1",
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.putObject).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("失败路径：超过大小上限直接拒绝，不写入对象存储", async () => {
    const { repo, storage, useCase } = buildMocks();

    await expect(
      useCase.uploadImage({
        fileName: "big.png",
        mimeType: "image/png",
        size: MAX_IMAGE_BYTES + 1,
        body: Buffer.from("image-bytes"),
        uploadedBy: "user-1",
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.putObject).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });
});
