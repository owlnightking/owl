import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { SpuService } from "./spu.service";
import type { SkuItem, SpuItem, SpuRepositoryPort } from "../domain/spu.ports";

const SPU_ID = 1;
const LINE_ID = 1;
const MISSING_SPU_ID = 99;
const EXISTING_INTERNAL_CODE = "SPU-2026-001";
const SECOND_INTERNAL_CODE = "SPU-2026-002";
const EXPECTED_NEXT_INTERNAL_CODE = "SPU-2026-003";
const MARKET_SPU_CODE = "A12345";
const SKU_PRICE_USD = 49.99;
const NEGATIVE_PRICE = -1;

function buildSpu(overrides?: Partial<SpuItem>): SpuItem {
  return {
    id: SPU_ID,
    productLineId: LINE_ID,
    internalCode: EXISTING_INTERNAL_CODE,
    spuCode: null,
    name: "桌面收纳盒 标准版",
    status: "concept",
    launchAt: null,
    notes: null,
    skuCount: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

function buildSku(overrides?: Partial<SkuItem>): SkuItem {
  return {
    id: SPU_ID,
    spuId: SPU_ID,
    skuCode: "SKU-BLACK-L",
    name: "黑色 大号",
    priceUsd: SKU_PRICE_USD,
    limited: false,
    stock: 0,
    enabled: true,
    notes: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function buildService(options?: { codes?: string[] }) {
  const repo: SpuRepositoryPort = {
    list: vi.fn(async () => ({ items: [buildSpu()], total: 1 })),
    findById: vi.fn(async (id) => (id === SPU_ID ? buildSpu() : null)),
    create: vi.fn(async (_productLineId, input) => buildSpu({ internalCode: input.internalCode, name: input.name })),
    update: vi.fn(async (_id, input) => buildSpu(input)),
    remove: vi.fn(async () => {}),
    listAllInternalCodes: vi.fn(async () => options?.codes ?? []),
    listSkus: vi.fn(async () => [buildSku()]),
    createSku: vi.fn(async (_spuId, input) => buildSku({ skuCode: input.skuCode, priceUsd: input.priceUsd })),
    updateSku: vi.fn(async (_id, input) => buildSku(input)),
    removeSku: vi.fn(async () => {}),
  };
  return { repo, service: new SpuService(repo) };
}

describe("SpuService.create", () => {
  it("成功路径：自动生成 SPU-YYYY-NNN 内部编号", async () => {
    const { repo, service } = buildService({ codes: [EXISTING_INTERNAL_CODE, SECOND_INTERNAL_CODE] });
    await service.create(LINE_ID, { name: "新品 SPU" });
    expect(repo.create).toHaveBeenCalledWith(
      LINE_ID,
      expect.objectContaining({ internalCode: EXPECTED_NEXT_INTERNAL_CODE })
    );
  });
});

describe("SpuService.update", () => {
  it("失败路径：非法状态被拒绝", async () => {
    const { service } = buildService();
    await expect(service.update(SPU_ID, { status: "bad" })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("成功路径：预发售回填市场 SPU 编码", async () => {
    const { service } = buildService();
    const updated = await service.update(SPU_ID, { spuCode: MARKET_SPU_CODE, status: "presale" });
    expect(updated.spuCode).toBe(MARKET_SPU_CODE);
  });
});

describe("SpuService.createSku", () => {
  it("成功路径：美元定价创建 SKU", async () => {
    const { service } = buildService();
    const sku = await service.createSku(SPU_ID, { skuCode: "SKU-BLACK-L", name: "黑色 大号", priceUsd: SKU_PRICE_USD });
    expect(sku.priceUsd).toBe(SKU_PRICE_USD);
  });

  it("失败路径：负数售价被拒绝", async () => {
    const { service } = buildService();
    await expect(
      service.createSku(SPU_ID, { skuCode: "SKU-X", name: "x", priceUsd: NEGATIVE_PRICE })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("失败路径：SPU 不存在抛 NotFound", async () => {
    const { service } = buildService();
    await expect(
      service.createSku(MISSING_SPU_ID, { skuCode: "SKU-X", name: "x", priceUsd: NEGATIVE_PRICE })
    ).rejects.toThrow(`spu ${MISSING_SPU_ID} not found`);
  });
});
