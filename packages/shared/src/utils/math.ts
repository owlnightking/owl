export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0 || !Number.isFinite(denominator)) {
    return 0;
  }
  return numerator / denominator;
}

export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatIsoWeek(date: Date): string {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const weekNum = Math.ceil(((date.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${year}W${String(weekNum).padStart(2, "0")}`;
}
