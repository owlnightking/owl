export interface MdDocItem {
  id: number;
  authorId: number;
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

export interface MdDocFileInput {
  name: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url: string;
  uploadedBy: number;
}

export interface MdDocRepositoryPort {
  findById(id: number): Promise<MdDocItem | null>;
  listByAuthor(authorId: number, query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }>;
  listAll(query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }>;
  create(authorId: number, input: MdDocCreateInput): Promise<MdDocItem>;
  update(id: number, input: MdDocUpdateInput): Promise<void>;
  delete(id: number): Promise<void>;
  listRoleCodes(userId: number): Promise<string[]>;
  createFileRecord(input: MdDocFileInput): Promise<number>;
}

export const MD_DOC_REPOSITORY = Symbol("MD_DOC_REPOSITORY");
export const MD_DOC_SERVICE = Symbol("MD_DOC_SERVICE");
