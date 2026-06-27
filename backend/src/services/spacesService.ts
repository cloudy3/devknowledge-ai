import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Config } from '../config.js';

export class SpacesService {
  private client: S3Client;
  constructor(private config: Config['spaces']) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
    });
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const extension = path.extname(file.originalname).toLowerCase();
    const key = `documents/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: { originalname: encodeURIComponent(file.originalname) }
    }));
    return key;
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }
}

