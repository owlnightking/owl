export interface FileItem {
  id: number;
  name: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url: string | null;
  uploadedBy: number;
  createdAt: Date;
}

export interface FileRepositoryPort {
  findById(id: number): Promise<FileItem | null>;
  listByUser(
    userId: number,
    options?: { page: number; pageSize: number }
  ): Promise<{ items: FileItem[]; total: number }>;
  create(input: {
    name: string;
    mimeType: string;
    size: number;
    bucket: string;
    objectKey: string;
    url?: string;
    uploadedBy: number;
  }): Promise<FileItem>;
  delete(id: number): Promise<void>;
}

export const FILE_REPOSITORY = Symbol("FILE_REPOSITORY");
export const FILE_SERVICE = Symbol("FILE_SERVICE");
