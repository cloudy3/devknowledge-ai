import type { Config } from '../config.js';
import { chunkText } from './chunkingService.js';
import { extractText } from './textExtractionService.js';
import type { InferenceService } from './inferenceService.js';
import type { Repository } from './repository.js';
import type { SpacesService } from './spacesService.js';

export class DocumentService {
  constructor(private config: Config, private repository: Repository, private spaces: SpacesService, private inference: InferenceService) {}

  async ingest(file: Express.Multer.File) {
    const text = await extractText(file);
    const chunks = chunkText(text, this.config.chunkSize, this.config.chunkOverlap);
    const embeddings = await this.inference.embed(chunks);
    const spacesKey = await this.spaces.upload(file);
    try {
      return await this.repository.saveDocument(file, spacesKey, chunks, embeddings);
    } catch (error) {
      await this.spaces.remove(spacesKey).catch(() => undefined);
      throw error;
    }
  }
}

