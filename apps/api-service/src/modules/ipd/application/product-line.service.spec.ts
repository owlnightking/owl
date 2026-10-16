import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ProductLineService } from "./product-line.service";
import type { ProductLineDetail, ProductLineRepositoryPort } from "../domain/product-line.ports";

const LINE_ID = 1;
const EXISTING_CODE = "PL-2026-001";
const SECOND_CODE = "PL-2026-002";
const LAST_YEAR_CODE = "PL-2025-009";
const EXPECTED_NEXT_CODE = "PL-2026-003";

function buildLine(overrides?: Partial<ProductLineDetail>): ProductLineDetail {
  return {
    id: LINE_ID,
    code: EXISTING_CODE,
    name: "硬核桌面收纳系列",
    styleDesc: "工业风",
    ipdStage: "opportunity",
    lifecycleStage: "incubating",
    targetMarket: "北美",
    notes: null,
    spuCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildService(options?: { codes?: string[]; line?: ProductLineDetail }) {
  const line = options?.line ?? buildLine();
  const repo: ProductLineRepositoryPort = {
    list: vi.fn(async () => ({ items: [line], total: 1 })),
    findById: vi.fn(async () => line),
    create: vi.fn(async (input) => buildLine({ code: input.code, name: input.name })),
    update: vi.fn(async () => line),
    updateStages: vi.fn(async (_id, input) => buildLine({ ...line, ...input })),
    remove: vi.fn(async () => {}),
    listAllCodes: vi.fn(async () => options?.codes ?? []),
  };
  return { repo, service: new ProductLineService(repo) };
}

describe("ProductLineService.create", () => {
  it("成功路径：按年度序列生成 PL-YYYY-NNN 编号", async () => {
    const { repo, service } = buildService({ codes: [EXISTING_CODE, SECOND_CODE, LAST_YEAR_CODE] });
    const created = await service.create({ name: "新品线" });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ code: EXPECTED_NEXT_CODE }));
    expect(created.code).toBe(EXPECTED_NEXT_CODE);
  });

  it("失败路径：编号从零开始（无存量编号）", async () => {
    const { repo, service } = buildService({ codes: [] });
    await service.create({ name: "首发线" });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ code: EXISTING_CODE }));
  });
});

describe("ProductLineService.updateStages", () => {
  it("失败路径：非法 IPD 阶段被拒绝", async () => {
    const { service } = buildService();
    await expect(service.updateStages(1, { ipdStage: "unknown-stage" })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("失败路径：非法生命周期阶段被拒绝", async () => {
    const { service } = buildService();
    await expect(service.updateStages(1, { lifecycleStage: "xxx" })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("成功路径：合法阶段可推进", async () => {
    const { service } = buildService();
    const updated = await service.updateStages(1, { ipdStage: "proposal" });
    expect(updated.ipdStage).toBe("proposal");
  });
});

describe("ProductLineService.applyDecisionOutcome", () => {
  it("成功路径：投决通过且处于立项期 → 自动进入预售期", async () => {
    const { repo, service } = buildService();
    await service.applyDecisionOutcome(1, "approved");
    expect(repo.updateStages).toHaveBeenCalledWith(1, { lifecycleStage: "presale" });
  });

  it("失败路径（不触发）：投决否决不改生命周期", async () => {
    const { repo, service } = buildService();
    await service.applyDecisionOutcome(1, "rejected");
    expect(repo.updateStages).not.toHaveBeenCalled();
  });

  it("失败路径（不触发）：已不在立项期不覆盖生命周期", async () => {
    const { repo, service } = buildService({ line: buildLine({ lifecycleStage: "new_product" }) });
    await service.applyDecisionOutcome(1, "approved");
    expect(repo.updateStages).not.toHaveBeenCalled();
  });
});

describe("ProductLineService.applyReviewOutcome", () => {
  it("成功路径：复盘决策清货 → 生命周期切清货期", async () => {
    const { repo, service } = buildService();
    await service.applyReviewOutcome(1, "liquidate");
    expect(repo.updateStages).toHaveBeenCalledWith(1, { lifecycleStage: "liquidation" });
  });

  it("失败路径（不触发）：其他复盘决策不动生命周期", async () => {
    const { repo, service } = buildService();
    await service.applyReviewOutcome(1, "hold");
    expect(repo.updateStages).not.toHaveBeenCalled();
  });
});
