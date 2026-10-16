import { BadRequestException } from "@nestjs/common";

const USD_DECIMAL_PLACES = 2;
const USD_SCALE = 10 ** USD_DECIMAL_PLACES;

// 人民币按汇率快照折算美元（四舍五入到分），折算结果用于主/副展示与输入校验
export function convertCnyToUsd(amountCny: number, exchangeRate: number): number {
  if (!Number.isFinite(amountCny) || amountCny < 0) {
    throw new BadRequestException("人民币金额必须为大于等于 0 的数字");
  }
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new BadRequestException("汇率必须为大于 0 的数字");
  }
  return Math.round(amountCny * exchangeRate * USD_SCALE) / USD_SCALE;
}

// 反向估算：美元折回人民币，用于录入校验（提示可能的输入错误）
export function estimateCnyFromUsd(amountUsd: number, exchangeRate: number): number {
  if (!Number.isFinite(amountUsd) || amountUsd < 0) {
    throw new BadRequestException("美元金额必须为大于等于 0 的数字");
  }
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new BadRequestException("汇率必须为大于 0 的数字");
  }
  return Math.round((amountUsd / exchangeRate) * USD_SCALE) / USD_SCALE;
}
