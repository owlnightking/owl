// 年度业务编号生成：prefix-YYYY-NNN（如 PL-2026-001）
const CODE_SEQUENCE_LENGTH = 3;
const CODE_PARTS = 3;

export function nextYearlyCode(prefix: string, existingCodes: string[], year: number): string {
  const yearPrefix = `${prefix}-${year}-`;
  let maxSeq = 0;
  for (const code of existingCodes) {
    if (!code.startsWith(yearPrefix)) continue;
    const seqText = code.slice(yearPrefix.length);
    const seq = Number(seqText);
    if (Number.isInteger(seq) && seq > maxSeq) maxSeq = seq;
  }
  const next = maxSeq + 1;
  return `${yearPrefix}${String(next).padStart(CODE_SEQUENCE_LENGTH, "0")}`;
}

export function isYearlyCode(code: string, prefix: string): boolean {
  const pattern = new RegExp(`^${prefix}-\\d{4}-\\d{${CODE_SEQUENCE_LENGTH}}$`);
  return pattern.test(code) && code.split("-").length === CODE_PARTS;
}
