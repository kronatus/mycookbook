// Types for recipe ingestion services

export interface ExtractedRecipe {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  instructions: Array<{
    stepNumber: number;
    description: string;
    duration?: number;
  }>;
  cookingTime?: number;
  prepTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  categories?: string[];
  tags?: string[];
  sourceUrl: string;
  sourceType: 'web' | 'video' | 'document' | 'manual';
  imageUrl?: string;
  author?: string;
  publishedDate?: Date;
}

export interface IngestionResult {
  success: boolean;
  recipe?: ExtractedRecipe;
  error?: {
    type: 'network' | 'parsing' | 'validation' | 'unsupported';
    message: string;
    details?: any;
  };
}

export interface SourceAdapter {
  canHandle(url: string): boolean;
  extract(url: string): Promise<IngestionResult>;
  getSupportedDomains(): string[];
}

export interface WebScrapingOptions {
  timeout?: number;
  userAgent?: string;
  followRedirects?: boolean;
  maxRedirects?: number;
}

export interface NormalizedContent {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  metadata: {
    cookingTime?: number;
    prepTime?: number;
    servings?: number;
    difficulty?: string;
    categories?: string[];
    tags?: string[];
    author?: string;
    publishedDate?: Date;
  };
}

export interface DocumentIngestionOptions {
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  extractImages?: boolean;
}

export interface DocumentIngestionResult {
  success: boolean;
  recipes?: ExtractedRecipe[];
  error?: {
    type: 'file_size' | 'file_type' | 'parsing' | 'validation' | 'processing';
    message: string;
    details?: any;
  };
  metadata?: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pageCount?: number;
    extractedText?: string;
  };
}

export interface ParsedDocument {
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pageCount?: number;
  };
}

export interface RecipeSection {
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}