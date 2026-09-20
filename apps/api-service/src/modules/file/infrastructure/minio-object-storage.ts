import { Injectable, Logger } from "@nestjs/common";
import { Client } from "minio";
import type { ObjectStoragePort, ObjectStoragePutInput } from "../domain/object-storage.ports";

const DEFAULT_MINIO_ENDPOINT = "localhost";
const DEFAULT_MINIO_PORT = 9000;
const DEFAULT_PUBLIC_URL = "http://localhost:9000";
const POLICY_VERSION = "2012-10-17";
const POLICY_PRINCIPAL = "*";
const GET_OBJECT_ACTION = "s3:GetObject";

@Injectable()
export class MinioObjectStorage implements ObjectStoragePort {
  private readonly logger = new Logger(MinioObjectStorage.name);
  private readonly client: Client;
  private readonly publicBaseUrl: string;
  private readonly readyBuckets = new Set<string>();

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? DEFAULT_MINIO_ENDPOINT,
      port: Number(process.env.MINIO_PORT ?? DEFAULT_MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY ?? "",
      secretKey: process.env.MINIO_SECRET_KEY ?? "",
    });
    this.publicBaseUrl = (process.env.MINIO_PUBLIC_URL ?? DEFAULT_PUBLIC_URL).replace(/\/+$/, "");
  }

  async putObject(bucket: string, input: ObjectStoragePutInput): Promise<void> {
    await this.ensurePublicBucket(bucket);
    await this.client.putObject(bucket, input.objectKey, input.body, input.size, {
      "Content-Type": input.contentType,
    });
  }

  async removeObject(bucket: string, objectKey: string): Promise<void> {
    await this.client.removeObject(bucket, objectKey);
  }

  buildPublicUrl(bucket: string, objectKey: string): string {
    return `${this.publicBaseUrl}/${bucket}/${objectKey}`;
  }

  private async ensurePublicBucket(bucket: string): Promise<void> {
    if (this.readyBuckets.has(bucket)) {
      return;
    }
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket);
      this.logger.log(`created minio bucket ${bucket}`);
    }
    await this.client.setBucketPolicy(bucket, this.publicReadPolicy(bucket));
    this.readyBuckets.add(bucket);
  }

  private publicReadPolicy(bucket: string): string {
    return JSON.stringify({
      Version: POLICY_VERSION,
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: [POLICY_PRINCIPAL] },
          Action: [GET_OBJECT_ACTION],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    });
  }
}
