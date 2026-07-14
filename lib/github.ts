import { Octokit } from '@octokit/rest';

// Initialize Octokit with token validation and refresh logic
let octokit: Octokit;
let tokenValidationCache: { isValid: boolean; timestamp: number } | null = null;
const TOKEN_VALIDATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize and validate GitHub token
async function initializeGitHubClient() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GitHub token is not configured. Please set GITHUB_TOKEN in your environment variables.');
  }

  try {
    // Check if we have a valid cached token validation
    if (tokenValidationCache && 
        Date.now() - tokenValidationCache.timestamp < TOKEN_VALIDATION_CACHE_DURATION && 
        tokenValidationCache.isValid) {
      return;
    }

    // Validate token format before initializing
    const token = process.env.GITHUB_TOKEN.trim();
    // Support both classic tokens (ghp_) and fine-grained tokens (github_pat_)
    if (!token.match(/^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{80,})$/)) {
      throw new Error('Invalid GitHub token format. Please ensure you are using a valid GitHub token.');
    }

    // Only create new Octokit instance if it doesn't exist or token has changed
    if (!octokit) {
      octokit = new Octokit({
        auth: token,
        request: {
          timeout: 60000, // 60 seconds timeout
          retries: 3, // Add retries for transient failures
          headers: {
            accept: 'application/vnd.github.v3+json',
            'user-agent': 'answergit-app'
          }
        }
      });
    }

    // Validate token with retries
    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount < maxRetries) {
      try {
        await validateGitHubToken();
        tokenValidationCache = { isValid: true, timestamp: Date.now() };
        break;
      } catch (validationError) {
        if (retryCount === maxRetries - 1) {
          tokenValidationCache = { isValid: false, timestamp: Date.now() };
          throw validationError;
        }
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  } catch (error) {
    // Clear token and cache on initialization failure
    process.env.GITHUB_TOKEN = undefined;
    tokenValidationCache = null;
    if (error instanceof Error) {
      throw new Error(`GitHub client initialization failed: ${error.message}`);
    }
    throw error;
  }
}

// Validate token by making a test API call with enhanced error handling
async function validateGitHubToken() {
  try {
    // First check rate limits before making the validation call
    const rateLimit = await octokit.rateLimit.get();
    const remaining = rateLimit.data.rate.remaining;
    const resetTime = new Date(rateLimit.data.rate.reset * 1000);
    
    if (remaining < 1) {
      const waitTime = Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60);
      throw new Error(`GitHub API rate limit exceeded. Rate limit will reset in ${waitTime} minutes. Please try again later.`);
    }

    const { data } = await octokit.users.getAuthenticated();
    console.log('GitHub token validated successfully for user:', data.login);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Bad credentials') || error.message.includes('Unauthorized')) {
        // Clear the token and force reinitialization
        process.env.GITHUB_TOKEN = undefined;
        throw new Error('GitHub token is invalid or expired. Please check your token and ensure it has the necessary permissions.');
      } else if (error.message.includes('rate limit')) {
        throw error; // Re-throw rate limit error as it's already formatted
      } else if (error.message.includes('403')) {
        // Handle specific 403 errors
        throw new Error('Access forbidden. Please ensure your GitHub token has the necessary scopes and permissions.');
      }
    }
    throw new Error('Failed to validate GitHub token: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Initialize GitHub client
initializeGitHubClient().catch(error => {
  console.error('Failed to initialize GitHub client:', error);
});

// Cache configuration
const CACHE_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_CONCURRENT_REQUESTS = 3;
const REQUEST_DELAY = 1000; // 1 second delay between requests

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache for repository data to avoid repeated API calls
const repoCache = new Map<string, CacheEntry<Promise<any>>>();
const fileCache = new Map<string, CacheEntry<Promise<FileNode[]>>>();
const contentCache = new Map<string, CacheEntry<Promise<string>>>();

// Request queue for rate limiting
let requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

async function processRequestQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const requests = requestQueue.splice(0, MAX_CONCURRENT_REQUESTS);
    await Promise.all(requests.map(request => request()));
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }
  }

  isProcessingQueue = false;
}

async function queueRequest<T>(request: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processRequestQueue();
  });
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
}

interface GitHubError extends Error {
  response?: {
    headers?: { [key: string]: string };
    data?: any;
  };
}

async function retryWithBackoff<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries || !(error instanceof Error && error.message.includes('rate limit'))) {
        throw error;
      }
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Rate limit hit, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

function isCacheValid<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> {
  return !!entry && (Date.now() - entry.timestamp) < CACHE_EXPIRATION_MS;
}

export async function fetchRepoData(username: string, repo: string) {
  try {
    // Ensure GitHub client is initialized and token is valid
    await initializeGitHubClient();
    
    const cacheKey = `${username}/${repo}`;
    
    // Check cache validity
    const cachedEntry = repoCache.get(cacheKey);
    if (isCacheValid(cachedEntry)) {
      return cachedEntry.data;
    }
    
    const promise = retryWithBackoff(async () => {
      try {
        // Fetch repository metadata
        const response = await octokit.repos.get({
          owner: username,
          repo: repo
        });
        
        const repoData = response.data;

        // Fetch repository contents
        const files = await fetchDirectoryContents(username, repo, '');

        return {
          name: repoData.name,
          owner: repoData.owner.login,
          description: repoData.description,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          language: repoData.language,
          files
        };
      } catch (error) {
        if (error instanceof Error) {
          const githubError = error as GitHubError;
          if (error.message.includes('Not Found')) {
            throw new Error(`Repository ${username}/${repo} not found. Please check if the repository exists and is accessible.`);
          } else if (error.message.includes('Bad credentials') || error.message.includes('Unauthorized')) {
            // Try to reinitialize GitHub client on authentication failure
            await initializeGitHubClient();
            throw new Error('GitHub token has expired or is invalid. Please check your token and try again.');
          } else if (error.message.includes('rate limit')) {
            const resetTime = new Date(Number(githubError.response?.headers?.['x-ratelimit-reset'] || 0) * 1000);
            const waitTime = Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60);
            throw new Error(`GitHub API rate limit exceeded. Rate limit will reset in ${waitTime} minutes. Please try again later.`);
          } else if (error.message.includes('API rate limit exceeded')) {
            throw new Error('GitHub API rate limit exceeded. Please authenticate or try again later.');
          }
        }
        console.error('Error fetching repo data:', error);
        throw new Error(`Failed to fetch repository data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    repoCache.set(cacheKey, { data: promise, timestamp: Date.now() });
    return promise;
  } catch (error) {
    // Handle initialization errors
    if (error instanceof Error && error.message.includes('GitHub token')) {
      throw new Error('GitHub authentication failed. Please ensure your token is valid and has the necessary permissions.');
    }
    throw error;
  }
}

export async function fetchDirectoryContents(owner: string, repo: string, path: string, fetchContent = false, depth = 0, maxDepth = 2): Promise<FileNode[]> {
  try {
    const cacheKey = `${owner}/${repo}/${path}`;
    
    const cachedEntry = fileCache.get(cacheKey);
    if (isCacheValid(cachedEntry)) {
      return cachedEntry.data;
    }
    
    const promise = retryWithBackoff(async () => {
      const { data: contents } = await octokit.repos.getContent({
        owner,
        repo,
        path: path || '',
        per_page: 100 // Limit items per request
      });

      const contentsData = contents as string | { type: string; path: string; sha: string }[];
      if (typeof contentsData === 'string' && contentsData.startsWith('<!DOCTYPE')) {
        throw new Error('GitHub API returned HTML response. This usually indicates an authentication or rate limit issue.');
      }

      if (!Array.isArray(contents)) {
        throw new Error('Expected directory contents');
      }

      const nodes: FileNode[] = [];
      const batchSize = 3; // Reduced batch size for better stability
      const batches: Array<Array<{ item: any; node: FileNode }>> = [];
      let currentBatch: Array<{ item: any; node: FileNode }> = [];

      // First pass: create all nodes
      for (const item of contents) {
        const node: FileNode = {
          name: item.name,
          path: item.path,
          type: item.type === 'dir' ? 'directory' : 'file'
        };
        nodes.push(node);

        if (item.type === 'dir' && depth < maxDepth) {
          currentBatch.push({ item, node });
          if (currentBatch.length === batchSize) {
            batches.push(currentBatch);
            currentBatch = [];
          }
        }
      }

      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }

      // Process batches with delay between each batch
      for (const batch of batches) {
        const batchPromises = batch.map(async ({ item, node }) => {
          try {
            const children = await fetchDirectoryContents(owner, repo, item.path, fetchContent, depth + 1);
            node.children = children;
          } catch (error) {
            console.error(`Error fetching contents for ${item.path}:`, error);
            node.children = []; // Set empty children on error
          }
        });

        await Promise.all(batchPromises);
        // Add delay between batches to avoid rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return nodes;
    });
    
    fileCache.set(cacheKey, { data: promise, timestamp: Date.now() });
    return promise;
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error(`Request timed out while fetching directory contents. The repository might be too large or the network connection is slow.`);
    }
    console.error(`Error fetching directory contents for ${path}:`, error);
    throw new Error(`Failed to fetch directory contents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchFileContent(filePath: string, username: string, repo: string) {
  try {
    // Ensure GitHub client is initialized
    await initializeGitHubClient();
    
    const cacheKey = `${username}/${repo}/${filePath}`;
    const cachedEntry = contentCache.get(cacheKey);
    if (isCacheValid(cachedEntry)) {
      return cachedEntry.data;
    }
    
    const promise = queueRequest(async () => {
      return await retryWithBackoff(async () => {
        const response = await octokit.repos.getContent({
          owner: username,
          repo,
          path: filePath
        });

        const { data } = response;

        // Check if response is HTML (indicating an error)
        if (typeof data === 'string') {
          const responseData = data as string;
          if (responseData && responseData.startsWith('<!DOCTYPE')) {
            throw new Error('GitHub API authentication failed. Please check your token.');
          }
          throw new Error('Invalid API response format');
        }

        // Check if we got a directory instead of a file
        if (Array.isArray(data)) {
          throw new Error('Requested path is a directory, not a file');
        }

        // Verify we have a file with content
        if (data.type !== 'file' || !('content' in data)) {
          throw new Error('Invalid file data received from GitHub API');
        }

        // GitHub API returns base64 encoded content
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return content;
      });
    });

    contentCache.set(cacheKey, { data: promise, timestamp: Date.now() });
    return promise;
  } catch (error) {
    console.error(`Error fetching file content for ${filePath}:`, error);
    throw new Error(`Failed to fetch file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

