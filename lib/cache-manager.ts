import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export interface CacheMetadata {
  timestamp: number;
  repoId: string;
}

export class CacheManager {
  private static ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  static getCachePath(username: string, repo: string): string {
    return path.join(CACHE_DIR, `${username}_${repo}_gitingest.json`);
  }

  static isDocumentProcessed(repoId: string): boolean {
    const [username, repo] = repoId.split('/');
    if (!username || !repo) return false;

    const cachePath = this.getCachePath(username, repo);
    if (!fs.existsSync(cachePath)) return false;

    try {
      const stats = fs.statSync(cachePath);
      const age = Date.now() - stats.mtimeMs;
      return age < CACHE_DURATION;
    } catch (error) {
      return false;
    }
  }

  static saveToCache(username: string, repo: string, data: any): void {
    this.ensureCacheDir();
    const cachePath = this.getCachePath(username, repo);
    fs.writeFileSync(cachePath, JSON.stringify(data));
  }

  static getFromCache(username: string, repo: string): any {
    const cachePath = this.getCachePath(username, repo);
    if (!fs.existsSync(cachePath)) return null;

    try {
      const data = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
}