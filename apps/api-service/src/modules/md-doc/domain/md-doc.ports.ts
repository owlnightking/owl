export interface MdDocItem {
  id: string;
  authorId: string;
  content: string;
  excerpt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MdDocCreateInput {
  content: string;
}

export interface MdDocUpdateInput {
  content: string;
}

export interface MdDocListQuery {
  page: number;
  pageSize: number;
  q?: string;
}

export interface MdDocRepositoryPort {
  findById(id: string): Promise<MdDocItem | null>;
  listByAuthor(authorId: string, query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }>;
  listAll(query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }>;
  create(authorId: string, input: MdDocCreateInput): Promise<MdDocItem>;
  update(id: string, input: MdDocUpdateInput): Promise<void>;
  delete(id: string): Promise<void>;
}

export const MD_DOC_REPOSITORY = Symbol("MD_DOC_REPOSITORY");
export const MD_DOC_SERVICE = Symbol("MD_DOC_SERVICE");
