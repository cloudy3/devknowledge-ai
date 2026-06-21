import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  SPACES_ENDPOINT: z.string().url(),
  SPACES_REGION: z.string().min(1),
  SPACES_BUCKET: z.string().min(1),
  SPACES_ACCESS_KEY_ID: z.string().min(1),
  SPACES_SECRET_ACCESS_KEY: z.string().min(1),
  DIGITALOCEAN_INFERENCE_API_KEY: z.string().min(1),
  DIGITALOCEAN_INFERENCE_BASE_URL: z.string().url().default('https://inference.do-ai.run/v1'),
  EMBEDDING_MODEL: z.string().default('qwen3-embedding-0.6b'),
  ANSWER_MODEL: z.string().default('deepseek-4-flash'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().max(50).default(10),
  CHUNK_SIZE: z.coerce.number().int().min(200).max(8000).default(1000),
  CHUNK_OVERLAP: z.coerce.number().int().min(0).default(150),
  RETRIEVAL_LIMIT: z.coerce.number().int().min(1).max(20).default(5),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080)
}).superRefine((value, context) => {
  if (value.CHUNK_OVERLAP >= value.CHUNK_SIZE) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['CHUNK_OVERLAP'], message: 'must be smaller than CHUNK_SIZE' });
  }
});

export type Config = {
  databaseUrl: string;
  spaces: { endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string };
  inference: { apiKey: string; baseUrl: string; embeddingModel: string; answerModel: string };
  frontendOrigins: string[];
  maxFileSizeBytes: number;
  chunkSize: number;
  chunkOverlap: number;
  retrievalLimit: number;
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(environment);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  const value = parsed.data;
  return {
    databaseUrl: value.DATABASE_URL,
    spaces: {
      endpoint: value.SPACES_ENDPOINT,
      region: value.SPACES_REGION,
      bucket: value.SPACES_BUCKET,
      accessKeyId: value.SPACES_ACCESS_KEY_ID,
      secretAccessKey: value.SPACES_SECRET_ACCESS_KEY
    },
    inference: {
      apiKey: value.DIGITALOCEAN_INFERENCE_API_KEY,
      baseUrl: value.DIGITALOCEAN_INFERENCE_BASE_URL.replace(/\/$/, ''),
      embeddingModel: value.EMBEDDING_MODEL,
      answerModel: value.ANSWER_MODEL
    },
    frontendOrigins: value.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()),
    maxFileSizeBytes: value.MAX_FILE_SIZE_MB * 1024 * 1024,
    chunkSize: value.CHUNK_SIZE,
    chunkOverlap: value.CHUNK_OVERLAP,
    retrievalLimit: value.RETRIEVAL_LIMIT,
    nodeEnv: value.NODE_ENV,
    port: value.PORT
  };
}

