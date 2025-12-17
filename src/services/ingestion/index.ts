// Main exports for the ingestion module
export { WebScrapingService } from './web-scraping-service';
export { ContentNormalizer } from './content-normalizer';
export { RecipeIngestionValidator } from './recipe-ingestion-validator';
export { VideoTranscriptionService } from './video-transcription-service';
export { DocumentIngestionService } from './document-ingestion-service';
export { ContentParser } from './content-parser';
export * from './types';
export * from './source-adapters';

// Re-export commonly used types
export type {
  ExtractedRecipe,
  IngestionResult,
  SourceAdapter,
  WebScrapingOptions,
  NormalizedContent,
  DocumentIngestionOptions,
  DocumentIngestionResult,
  ParsedDocument,
  RecipeSection,
} from './types';

export type { IngestionValidationResult } from './recipe-ingestion-validator';
export type { VideoMetadata, TranscriptionResult } from './video-transcription-service';