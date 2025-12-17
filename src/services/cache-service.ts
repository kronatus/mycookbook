import { createClient, RedisClientType } from 'redis';
import type { Recipe } from '../db/schema';

export interface CacheConfig {
  url?: string;
  ttl: {
    recipe: number;
    search: number;
    userRecipes: number;
  };
}

export class CacheService {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private isConnected = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      url: config?.url || process.env.REDIS_URL,
      ttl: {
        recipe: config?.ttl?.recipe || 3600, // 1 hour
        search: config?.ttl?.search || 1800, // 30 minutes
        userRecipes: config?.ttl?.userRecipes || 1800, // 30 minutes
        ...config?.ttl
      }
    };

    // Only initialize Redis in production or when explicitly configured
    if (this.config.url && process.env.NODE_ENV !== 'test') {
      this.initializeClient();
    }
  }

  private async initializeClient() {
    try {
      if (!this.config.url) {
        console.log('Redis URL not configured, caching disabled');
        return;
      }

      this.client = createClient({
        url: this.config.url,
        socket: {
          connectTimeout: 5000,
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  private generateKey(prefix: string, ...parts: string[]): string {
    return `cookbook:${prefix}:${parts.join(':')}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Recipe-specific cache methods
  async getRecipe(recipeId: string): Promise<Recipe | null> {
    const key = this.generateKey('recipe', recipeId);
    return this.get<Recipe>(key);
  }

  async setRecipe(recipe: Recipe): Promise<boolean> {
    const key = this.generateKey('recipe', recipe.id);
    return this.set(key, recipe, this.config.ttl.recipe);
  }

  async deleteRecipe(recipeId: string): Promise<boolean> {
    const key = this.generateKey('recipe', recipeId);
    return this.del(key);
  }

  async getUserRecipes(userId: string, filterHash?: string): Promise<Recipe[] | null> {
    const key = filterHash 
      ? this.generateKey('user_recipes', userId, filterHash)
      : this.generateKey('user_recipes', userId);
    return this.get<Recipe[]>(key);
  }

  async setUserRecipes(userId: string, recipes: Recipe[], filterHash?: string): Promise<boolean> {
    const key = filterHash 
      ? this.generateKey('user_recipes', userId, filterHash)
      : this.generateKey('user_recipes', userId);
    return this.set(key, recipes, this.config.ttl.userRecipes);
  }

  async invalidateUserRecipes(userId: string): Promise<boolean> {
    const pattern = this.generateKey('user_recipes', userId, '*');
    return this.delPattern(pattern);
  }

  async getSearchResults(userId: string, searchTerm: string): Promise<Recipe[] | null> {
    const key = this.generateKey('search', userId, Buffer.from(searchTerm).toString('base64'));
    return this.get<Recipe[]>(key);
  }

  async setSearchResults(userId: string, searchTerm: string, results: Recipe[]): Promise<boolean> {
    const key = this.generateKey('search', userId, Buffer.from(searchTerm).toString('base64'));
    return this.set(key, results, this.config.ttl.search);
  }

  async invalidateUserCache(userId: string): Promise<boolean> {
    const patterns = [
      this.generateKey('user_recipes', userId, '*'),
      this.generateKey('search', userId, '*')
    ];

    const results = await Promise.all(patterns.map(pattern => this.delPattern(pattern)));
    return results.every(result => result);
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
      } catch (error) {
        console.error('Error disconnecting Redis client:', error);
      }
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
}

// Utility function to create a hash for filter objects
export function createFilterHash(filters: any): string {
  return Buffer.from(JSON.stringify(filters)).toString('base64');
}