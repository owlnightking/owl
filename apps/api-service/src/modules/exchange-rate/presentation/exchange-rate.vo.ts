import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ExchangeRateVo {
  @ApiProperty({ description: "汇率 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "基础货币", example: "CNY" })
  base!: string;

  @ApiProperty({ description: "报价货币", example: "USD" })
  quote!: string;

  @ApiProperty({ description: "汇率（1 base = rate quote）", example: 0.14 })
  rate!: number;

  @ApiProperty({ description: "来源：api / manual", example: "manual" })
  source!: string;

  @ApiProperty({ description: "人工校验标记", example: true })
  verified!: boolean;

  @ApiProperty({ description: "生效日期", example: "2026-10-15T00:00:00.000Z" })
  effectiveDate!: string;

  @ApiProperty({ description: "创建时间", example: "2026-10-15T10:00:00.000Z" })
  createdAt!: string;
}

export class ExchangeRatePageVo {
  @ApiProperty({ description: "列表", type: [ExchangeRateVo] })
  list!: ExchangeRateVo[];

  @ApiProperty({ description: "页码", example: 1 })
  pageNum!: number;

  @ApiProperty({ description: "每页条数", example: 20 })
  pageSize!: number;

  @ApiProperty({ description: "总数", example: 1 })
  total!: number;
}

export class CreateExchangeRateDto {
  @ApiPropertyOptional({ description: "基础货币，默认 CNY", example: "CNY" })
  base?: string;

  @ApiPropertyOptional({ description: "报价货币，默认 USD", example: "USD" })
  quote?: string;

  @ApiProperty({ description: "汇率（1 base = rate quote）", example: 0.14 })
  rate!: number;

  @ApiPropertyOptional({ description: "生效日期，默认今天", example: "2026-10-15" })
  effectiveDate?: string;
}

export class UpdateExchangeRateDto {
  @ApiPropertyOptional({ description: "汇率", example: 0.14 })
  rate?: number;

  @ApiPropertyOptional({ description: "人工校验标记", example: true })
  verified?: boolean;

  @ApiPropertyOptional({ description: "生效日期", example: "2026-10-15" })
  effectiveDate?: string;
}
