// ipd 模块对外契约：跨模块只允许从本 index 导入（架构护栏）
export { PRODUCT_LINE_SERVICE } from "./domain/product-line.ports";
export type { ProductLineDetail, ProductLineItem } from "./domain/product-line.ports";
export { SPU_SERVICE } from "./domain/spu.ports";
export type { SkuItem, SpuItem } from "./domain/spu.ports";
export type { ProductLineService } from "./application/product-line.service";
export type { SpuService } from "./application/spu.service";
