import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { convertCnyToUsd, estimateCnyFromUsd } from "./cny-usd";

const RATE = 0.14;
const PRECISE_RATE = 0.1429;
const LARGE_CNY = 85000;
const LARGE_USD = 11900;
const SMALL_CNY = 100;
const SMALL_USD = 14.29;
const NEGATIVE_USD = -5;
const ZERO_RATE = 0;

describe("convertCnyToUsd", () => {
  it("成功路径：人民币 × 汇率折算美元，四舍五入到分", () => {
    expect(convertCnyToUsd(LARGE_CNY, RATE)).toBe(LARGE_USD);
    expect(convertCnyToUsd(SMALL_CNY, PRECISE_RATE)).toBe(SMALL_USD);
    expect(convertCnyToUsd(ZERO_RATE, RATE)).toBe(ZERO_RATE);
  });

  it("失败路径：负数人民币被拒绝", () => {
    expect(() => convertCnyToUsd(NEGATIVE_USD, RATE)).toThrow(BadRequestException);
  });

  it("失败路径：非正汇率被拒绝", () => {
    expect(() => convertCnyToUsd(SMALL_CNY, ZERO_RATE)).toThrow(BadRequestException);
    expect(() => convertCnyToUsd(SMALL_CNY, NEGATIVE_USD)).toThrow(BadRequestException);
  });
});

describe("estimateCnyFromUsd", () => {
  it("成功路径：美元反推人民币，用于录入校验", () => {
    expect(estimateCnyFromUsd(LARGE_USD, RATE)).toBe(LARGE_CNY);
  });

  it("失败路径：非法输入被拒绝", () => {
    expect(() => estimateCnyFromUsd(NEGATIVE_USD, RATE)).toThrow(BadRequestException);
  });
});
