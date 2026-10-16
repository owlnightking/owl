import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ExchangeRateService } from "./exchange-rate.service";
import type { ExchangeRateItem, ExchangeRateRepositoryPort } from "../domain/exchange-rate.ports";

const SAMPLE_DATE = new Date("2026-10-15T00:00:00.000Z");
const EXISTING_RATE_ID = 1;
const MISSING_RATE_ID = 99;
const BASE_RATE = 0.14;
const MANUAL_RATE = 0.141;
const PATCHED_RATE = 0.145;
const MISSING_UPDATE_RATE = 0.15;

function buildRate(overrides?: Partial<ExchangeRateItem>): ExchangeRateItem {
  return {
    id: EXISTING_RATE_ID,
    base: "CNY",
    quote: "USD",
    rate: BASE_RATE,
    source: "api",
    verified: false,
    effectiveDate: SAMPLE_DATE,
    createdAt: SAMPLE_DATE,
    ...overrides,
  };
}

function buildService() {
  const repo: ExchangeRateRepositoryPort = {
    list: vi.fn(async () => ({ items: [buildRate()], total: 1 })),
    findById: vi.fn(async (id) => (id === EXISTING_RATE_ID ? buildRate() : null)),
    findLatest: vi.fn(async () => buildRate()),
    create: vi.fn(async (input) => buildRate({ ...input, rate: input.rate })),
    update: vi.fn(async (id, input) => (id === EXISTING_RATE_ID ? buildRate(input) : null)),
    remove: vi.fn(async () => {}),
  };
  return { repo, service: new ExchangeRateService(repo) };
}

describe("ExchangeRateService.createManual", () => {
  it("成功路径：手工录入标记 source=manual 且默认已校验", async () => {
    const { repo, service } = buildService();
    const created = await service.createManual({
      base: "CNY",
      quote: "USD",
      rate: MANUAL_RATE,
      source: "manual",
      effectiveDate: SAMPLE_DATE,
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: "manual", verified: true, rate: MANUAL_RATE })
    );
    expect(created.rate).toBe(MANUAL_RATE);
  });

  it("失败路径：非正汇率被拒绝", async () => {
    const { service } = buildService();
    await expect(
      service.createManual({ base: "CNY", quote: "USD", rate: 0, source: "manual", effectiveDate: SAMPLE_DATE })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("ExchangeRateService.update", () => {
  it("失败路径：不存在的汇率更新抛 NotFound", async () => {
    const { service } = buildService();
    await expect(service.update(MISSING_RATE_ID, { rate: MISSING_UPDATE_RATE })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it("成功路径：人工校验标记可更新", async () => {
    const { service } = buildService();
    const updated = await service.update(EXISTING_RATE_ID, { verified: true, rate: PATCHED_RATE });
    expect(updated.verified).toBe(true);
    expect(updated.rate).toBe(PATCHED_RATE);
  });
});

describe("ExchangeRateService.latest", () => {
  it("成功路径：返回最新一条汇率", async () => {
    const { service } = buildService();
    const latest = await service.latest("CNY", "USD");
    expect(latest?.rate).toBe(BASE_RATE);
  });
});
