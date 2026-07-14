import { useState, useEffect } from 'react'

export function useGithubStars(owner: string, repo: string) {
  const [stars, setStars] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchStars = async () => {
      try {
        setLoading(true)
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
        if (!response.ok) {
          throw new Error('Failed to fetch repository data')
        }
        const data = await response.json()
        setStars(data.stargazers_count)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stars'))
        setStars(0)
      } finally {
        setLoading(false)
      }
    }

    fetchStars()
  }, [owner, repo])

  return { stars, loading, error }
}