import chalk from 'chalk';

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug' | 'warn';

interface LogOptions {
  timestamp?: boolean;
  prefix?: string;
  level?: LogLevel;
}

class Logger {
  private static instance: Logger;
  private debugMode: boolean = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(message: string, options: LogOptions = {}): string {
    const parts: string[] = [];
    
    if (options.timestamp !== false) {
      parts.push(chalk.gray(`[${this.getTimestamp()}]`));
    }

    if (options.prefix) {
      parts.push(chalk.cyan(`[${options.prefix}]`));
    }

    switch (options.level) {
      case 'success':
        parts.push(chalk.green(message));
        break;
      case 'warning':
        parts.push(chalk.yellow(message));
        break;
      case 'error':
        parts.push(chalk.red(message));
        break;
      case 'debug':
        parts.push(chalk.magenta(message));
        break;
      default:
        parts.push(message);
    }

    return parts.join(' ');
  }

  info(message: string, options: LogOptions = {}) {
    console.log(this.formatMessage(message, { ...options, level: 'info' }));
  }

  success(message: string, options: LogOptions = {}) {
    console.log(this.formatMessage(message, { ...options, level: 'success' }));
  }

  warning(message: string, options: LogOptions = {}) {
    console.warn(this.formatMessage(message, { ...options, level: 'warning' }));
  }

  warn(message: string, options: LogOptions = {}) {
    this.warning(message, options);
  }

  error(message: string, options: LogOptions = {}) {
    console.error(this.formatMessage(message, { ...options, level: 'error' }));
  }

  debug(message: string, options: LogOptions = {}) {
    if (this.debugMode) {
      console.debug(this.formatMessage(message, { ...options, level: 'debug' }));
    }
  }

  // Repository analysis specific logging methods
  repoAnalysis = {
    start: (repoId: string) => {
      this.info(`Starting analysis of repository: ${repoId}`, { prefix: 'Analysis' });
    },
    fileDiscovered: (count: number) => {
      this.info(`Found ${count} total files in repository`, { prefix: 'Analysis' });
    },
    relevantFiles: (count: number) => {
      this.info(`Selected ${count} relevant files for analysis`, { prefix: 'Analysis' });
    },
    processingFile: (filePath: string) => {
      this.debug(`Processing file: ${filePath}`, { prefix: 'Analysis' });
    },
    fileProcessed: (filePath: string, chunks: number) => {
      this.success(`Processed ${filePath} (${chunks} chunks)`, { prefix: 'Analysis' });
    },
    error: (filePath: string, error: string) => {
      this.error(`Error processing ${filePath}: ${error}`, { prefix: 'Analysis' });
    },
    complete: (processedCount: number, errorCount: number) => {
      this.success(
        `Analysis complete. Processed ${processedCount} files${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
        { prefix: 'Analysis' }
      );
    }
  };

  // Embedding specific logging methods
  embeddings = {
    generating: (text: string) => {
      this.debug(`Generating embedding for text (${text.length} chars)`, { prefix: 'Embeddings' });
    },
    stored: (documentId: string) => {
      this.success(`Stored embeddings for document: ${documentId}`, { prefix: 'Embeddings' });
    },
    error: (error: string) => {
      this.error(`Embedding error: ${error}`, { prefix: 'Embeddings' });
    }
  };

  // Search and embedding specific logging methods
  search = {
    start: (query: string) => {
      this.info(`Starting vector search for query: ${query}`, { prefix: 'Search' });
    },
    results: (count: number) => {
      this.success(`Found ${count} relevant documents`, { prefix: 'Search' });
    },
    details: (docs: Array<{ similarity: number; filePath: string }>) => {
      this.debug('Search results details:', { prefix: 'Search' });
      docs.forEach(doc => {
        this.debug(`- ${doc.filePath} (similarity: ${(doc.similarity * 100).toFixed(2)}%)`, { prefix: 'Search' });
      });
    },
    error: (error: string) => {
      this.error(`Search error: ${error}`, { prefix: 'Search' });
    }
  };

  // Context preparation logging methods
  context = {
    start: () => {
      this.info('Preparing context for Gemini...', { prefix: 'Context' });
    },
    stats: (stats: { files: number; totalChars: number }) => {
      this.info(`Context prepared with ${stats.files} files (${stats.totalChars} characters)`, { prefix: 'Context' });
    },
    error: (error: string) => {
      this.error(`Context preparation error: ${error}`, { prefix: 'Context' });
    }
  };
}

export const logger = Logger.getInstance();