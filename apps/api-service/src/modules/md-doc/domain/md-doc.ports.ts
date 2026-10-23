export interface MdDocCollaboratorItem {
  userId: number;
  name: string;
  avatarUrl: string | null;
}

export interface MdDocItem {
  id: number;
  authorId: number;
  authorName: string | null;
  authorAvatarUrl: string | null;
  updatedBy: number | null;
  updatedByName: string | null;
  updatedByAvatarUrl: string | null;
  content: string;
  excerpt: string | null;
  createdAt: Date;
  updatedAt: Date;
  collaborators: MdDocCollaboratorItem[];
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

export interface MdDocUserOption {
  id: number;
  name: string;
  email: string | null;
  avatarUrl: string | null;
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
  listAccessible(userId: number, query: MdDocListQuery): Promise<{ items: MdDocItem[]; total: number }>;
  create(authorId: number, input: MdDocCreateInput): Promise<MdDocItem>;
  update(id: number, input: MdDocUpdateInput, updatedBy: number): Promise<void>;
  delete(id: number): Promise<void>;
  listUserOptions(keyword?: string): Promise<MdDocUserOption[]>;
  findExistingUserIds(userIds: number[]): Promise<number[]>;
  listCollaborators(docId: number): Promise<MdDocCollaboratorItem[]>;
  replaceCollaborators(docId: number, userIds: number[]): Promise<void>;
  createFileRecord(input: MdDocFileInput): Promise<number>;
}

export const MD_DOC_REPOSITORY = Symbol("MD_DOC_REPOSITORY");
export const MD_DOC_SERVICE = Symbol("MD_DOC_SERVICE");
