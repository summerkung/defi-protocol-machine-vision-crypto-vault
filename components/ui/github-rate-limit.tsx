'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';

interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export function GitHubRateLimit() {
  const [rateLimit, setRateLimit] = React.useState<RateLimit | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { theme } = useTheme();

  const fetchRateLimit = async () => {
    try {
      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          ...(token && { Authorization: `token ${token}` }),
        },
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      if (data && data.rate && typeof data.rate.limit === 'number' && 
          typeof data.rate.remaining === 'number' && 
          typeof data.rate.reset === 'number') {
        setRateLimit({
          limit: data.rate.limit,
          remaining: data.rate.remaining,
          reset: data.rate.reset,
        });
      } else {
        console.error('Invalid rate limit data structure:', data);
        setRateLimit(null);
      }
    } catch (error) {
      console.error('Error fetching rate limit:', error);
      setRateLimit(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRateLimit();
    // Update rate limit every minute
    const interval = setInterval(fetchRateLimit, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-24 flex items-center gap-2">
        <span className="text-sm font-medium">...</span>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  if (!rateLimit) {
    return null;
  }

  const percentage = (rateLimit.remaining / rateLimit.limit) * 100;
  const resetTime = new Date(rateLimit.reset * 1000).toLocaleTimeString();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="w-24 flex items-center gap-2">
            <span className="text-sm font-medium">{rateLimit.remaining}</span>
            <Progress
              value={percentage}
              className="h-2 w-full"
              indicatorClassName={`${theme === 'dark' ? 'bg-green-500' : 'bg-green-600'} transition-all`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {`${rateLimit.remaining}/${rateLimit.limit} requests remaining. Resets at ${resetTime}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
