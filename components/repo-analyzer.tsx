'use client'

import { useEffect, useState, useCallback } from 'react'

interface RepoAnalyzerProps {
  username: string
  repo: string
}

export default function RepoAnalyzer({ username, repo }: RepoAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  const triggerAnalysis = useCallback(async (forceRefresh = false) => {
    try {
      setIsAnalyzing(true)
      setError(null)
      
      const baseUrl = window.location.origin
      
      const response = await fetch(`${baseUrl}/api/collect-repo-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          repo,
          force_refresh: forceRefresh
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        if (response.status === 429 && retryCount < MAX_RETRIES) {
          // Rate limit hit - wait and retry
          setRetryCount(prev => prev + 1)
          setTimeout(() => triggerAnalysis(forceRefresh), 2000 * (retryCount + 1))
          return
        }
        setError(result.error || 'Failed to analyze repository')
        console.error('Failed to analyze repository:', result.error)
      } else {
        setHasAnalyzed(true)
        setRetryCount(0)
        console.log('Repository analysis completed successfully')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error analyzing repository:', errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }, [username, repo, retryCount])

  useEffect(() => {
    if (!hasAnalyzed) {
      triggerAnalysis(false)
    }
  }, [hasAnalyzed, triggerAnalysis])

  // Reset states when username/repo changes
  useEffect(() => {
    setHasAnalyzed(false)
    setError(null)
    setRetryCount(0)
  }, [username, repo])

  return null // This component doesn't render anything
}