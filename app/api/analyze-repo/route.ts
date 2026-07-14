import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache-manager';

export async function POST(req: NextRequest) {
    try {
        const { username, repo, force_refresh = false } = await req.json();
        const repoId = `${username}/${repo}`;

        const apiUrl = process.env.GITINGEST_API_URL;
        if (!apiUrl) {
            return NextResponse.json({ success: false, error: "GITINGEST_API_URL not set in environment." }, { status: 500 });
        }

        logger.info(`Starting data collection for repository: ${username}/${repo} using GitIngest`, { prefix: 'GitIngest' });
        
        logger.info(`Sending payload: ${JSON.stringify({ github_link: `https://github.com/${username}/${repo}` })}`, { prefix: 'GitIngest' }); // ADD THIS LINE
        const response = await fetch(`${apiUrl}/ingest/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ github_link: `https://github.com/${username}/${repo}` })
        });
      

        if (!response.ok) {
            const errorText = await response.text();
                let errorJson;
                try {
                    errorJson = JSON.parse(errorText);
                } catch (e) {
                    // If not JSON, use the text as is
                    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
                }
                throw new Error(errorJson.detail || `API request failed with status ${response.status}`);
            }

        const result = await response.json();
        logger.info(`Received response with status: ${response.status}`, { prefix: 'GitIngest' });
        logger.info(`Response body: ${JSON.stringify(result)}`, { prefix: 'GitIngest' });
            
        // First, check if the response has the expected structure
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid response format from GitIngest');
        }
            
        // Handle both direct data format and nested data format
        let data;
            
        if (result.data && typeof result.data === 'object') {
            // Standard format: { success: true, data: { summary, tree, content } }
            data = result.data;
        } else if (result.summary && result.tree && result.content) {
            // Alternative format: the result itself contains the data fields
            data = result;
        } else {
            // Neither format matches
            throw new Error('GitIngest response missing required data fields');
        }

        // Validate required fields exist
        if (!data.summary || !data.tree || !data.content) {
          logger.warn('Some GitIngest fields may be missing, but proceeding with available data', { prefix: 'GitIngest' });
        }

        if (result.success === false) {
          // Handle specific error types
          if (result.error === 'error:repo_not_found') {
            logger.warn(`Repository not found: ${repoId}`, { prefix: 'GitIngest' });
            return NextResponse.json(
              {
                success: false,
                error: `Repository not found: ${repoId}. Please verify the username and repository name.`
              },
              { status: 404 }
            );
          } else if (result.error === 'error:repo_too_large') {
            logger.warn(`Repository too large: ${repoId}`, { prefix: 'GitIngest' });
            return NextResponse.json(
              {
                success: false,
                error: `Repository ${repoId} is too large to process. Please try a smaller repository.`
              },
              { status: 413 }
            );
          } else if (result.error === 'error:repo_private') {
            logger.warn(`Repository is private or rate limited: ${repoId}`, { prefix: 'GitIngest' });
            return NextResponse.json(
              {
                success: false,
                error: `Repository ${repoId} is private or GitHub API rate limit exceeded. Please try again later.`
              },
              { status: 403 }
            );
          }
            
          throw new Error(result.error || 'Unknown error from GitIngest');
        }

        // Ensure files array exists even if not provided by GitIngest
        if (!data.files) {
          data.files = [];  // Initialize empty files array if not present
        }
            
        return NextResponse.json({
          success: true,
          data: { // Now, data key has to include all data
            ...result,  // Include all fields returned by GitIngest
            success: true // Explicitly confirm success
          }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to process repository: ${errorMessage}`, { prefix: 'GitIngest' });
        return NextResponse.json(
            {
                success: false,
                error: `Failed to process repository with GitIngest: ${errorMessage}`
            },
            { status: 500 }
        );
    }
}

// Helper function to format GitIngest data for Gemini
function formatGitIngestData(result: any) {
    // The GitIngest API returns a response in this format:
    // { success: true, data: { summary: "...", tree: "...", content: "..." } }
    // But sometimes it might return the data directly without nesting

    // First determine where the actual data is located
    let data;

    if (result.data && typeof result.data === 'object') {
        // Standard format with nested data object
        data = result.data;
    } else if (result.summary || result.tree || result.content) {
        // Alternative format: the result itself contains the data
        data = result;
    } else if (typeof result === 'object') {
        // Unknown format but still an object, use as is
        data = result;
    } else {
        // Fallback for unexpected formats
        logger.warn('Unexpected GitIngest data format', { prefix: 'GitIngest' });
        data = {};
    }

    // Create a properly formatted object with all required fields
    return {
        summary: data.summary || 'No summary available',
        tree: data.tree || 'No tree structure available',
        content: data.content || '',
        timestamp: Date.now(),
        files: Array.isArray(data.files) ? data.files.map((f: any) => ({
            name: f.name || 'unknown',
            path: f.path || '',
            type: f.type || 'file',
            priority: f.priority || 0
        })) : []
    };
}
