export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export interface FileRepositoryPort {
  findById(id: string): Promise<FileItem | null>;
  listByUser(
    userId: string,
    options?: { page: number; pageSize: number }
  ): Promise<{ items: FileItem[]; total: number }>;
  create(input: {
    name: string;
    mimeType: string;
    size: number;
    bucket: string;
    objectKey: string;
    url?: string;
    uploadedBy: string;
  }): Promise<FileItem>;
  delete(id: string): Promise<void>;
}

export const FILE_REPOSITORY = Symbol("FILE_REPOSITORY");
export const FILE_SERVICE = Symbol("FILE_SERVICE");
