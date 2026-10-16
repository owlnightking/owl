import { describe, expect, it, vi } from "vitest";
import { ExchangeRateSyncService } from "./exchange-rate-sync.service";
import type { ExchangeRateFetcherPort, ExchangeRateWriterPort, FetchedRate } from "../domain/exchange-rate-sync.ports";

function buildService(options?: { fetchResult?: FetchedRate; fetchError?: Error; written?: boolean }) {
  const fetcher: ExchangeRateFetcherPort = {
    fetchCnyToUsd: vi.fn(async () => options?.fetchResult ?? { rate: 0.1412, fetchedAt: new Date() }),
  };
  if (options?.fetchError) {
    fetcher.fetchCnyToUsd = vi.fn(async () => {
      throw options.fetchError;
    });
  }
  const writer: ExchangeRateWriterPort = {
    insertIfAbsent: vi.fn(async () => options?.written ?? true),
    findTodayApiRate: vi.fn(async () => null),
  };
  return { fetcher, writer, service: new ExchangeRateSyncService(fetcher, writer) };
}

describe("ExchangeRateSyncService.execute", () => {
  it("成功路径：抓取后以 source=api 写入汇率表", async () => {
    const { writer, service } = buildService({ written: true });
    await service.execute();
    expect(writer.insertIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({ base: "CNY", quote: "USD", rate: 0.1412, source: "api" })
    );
  });

  it("失败路径：抓取失败不写库（保留旧值）", async () => {
    const { writer, service } = buildService({ fetchError: new Error("network down") });
    await expect(service.execute()).resolves.toBeUndefined();
    expect(writer.insertIfAbsent).not.toHaveBeenCalled();
  });

  it("成功路径：当日同值跳过写入", async () => {
    const { writer, service } = buildService({ written: false });
    await service.execute();
    expect(writer.insertIfAbsent).toHaveBeenCalled();
  });
});
