// exchange-rate 模块对外契约：跨模块只允许从本 index 导入（架构护栏）
export { EXCHANGE_RATE_SERVICE } from "./domain/exchange-rate.ports";
export type { ExchangeRateServicePort } from "./domain/exchange-rate.ports";
