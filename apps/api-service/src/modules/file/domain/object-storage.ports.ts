export interface ObjectStoragePutInput {
  objectKey: string;
  body: Buffer;
  contentType: string;
  size: number;
}

export interface ObjectStoragePort {
  putObject(bucket: string, input: ObjectStoragePutInput): Promise<void>;
  removeObject(bucket: string, objectKey: string): Promise<void>;
  buildPublicUrl(bucket: string, objectKey: string): string;
}

export const OBJECT_STORAGE = Symbol("OBJECT_STORAGE");
