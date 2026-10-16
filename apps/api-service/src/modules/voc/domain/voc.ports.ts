export interface VocTicketItem {
  id: number;
  source: string;
  productLineId: number | null;
  productLineName: string | null;
  spuId: number | null;
  spuName: string | null;
  title: string;
  content: string | null;
  category: string;
  status: string;
  handledNote: string | null;
  createdAt: Date;
}

export interface VocTicketCreateInput {
  source: string;
  productLineId?: number;
  spuId?: number;
  title: string;
  content?: string;
  category?: string;
  status?: string;
  handledNote?: string;
}

export interface VocTicketUpdateInput {
  productLineId?: number;
  spuId?: number;
  title?: string;
  content?: string;
  category?: string;
  status?: string;
  handledNote?: string;
}

export interface VocTicketListOptions {
  source?: string;
  category?: string;
  status?: string;
  productLineId?: number;
  spuId?: number;
  page: number;
  pageSize: number;
}

export interface VocRepositoryPort {
  list(options: VocTicketListOptions): Promise<{ items: VocTicketItem[]; total: number }>;
  findById(id: number): Promise<VocTicketItem | null>;
  create(input: VocTicketCreateInput): Promise<VocTicketItem>;
  update(id: number, input: VocTicketUpdateInput): Promise<VocTicketItem | null>;
  remove(id: number): Promise<boolean>;
}

export const VOC_REPOSITORY = Symbol("VOC_REPOSITORY");
export const VOC_SERVICE = Symbol("VOC_SERVICE");
