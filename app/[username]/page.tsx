"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Star, GitFork, Book, Users, MapPin, Link as LinkIcon, Calendar } from "lucide-react"

interface Repository {
  id: number
  name: string
  description: string
  stargazers_count: number
  forks_count: number
  language: string
  updated_at: string
  html_url: string
}

interface UserProfile {
  login: string
  name: string
  avatar_url: string
  bio: string
  location: string
  blog: string
  followers: number
  following: number
  public_repos: number
  created_at: string
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [profileRes, reposRes] = await Promise.all([
          fetch(`https://api.github.com/users/${username}`),
          fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
        ])

        if (!profileRes.ok || !reposRes.ok) throw new Error('Failed to fetch data')

        const profileData = await profileRes.json()
        const reposData = await reposRes.json()

        setProfile(profileData)
        setRepositories(reposData)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [username])

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-zinc-900 to-black">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-zinc-900 to-black">
        <div className="text-center text-zinc-400">
          <p>Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          size="sm"
          className="mb-6 bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
        >
          ← Back
        </Button>
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-200 blur"></div>
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-zinc-800"
            />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
              <p className="text-lg text-emerald-500">@{profile.login}</p>
            </div>
            {profile.bio && (
              <p className="text-zinc-300">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}
              {profile.blog && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <a href={profile.blog} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400">
                    {profile.blog}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-sm">Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{profile.public_repos}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-sm">Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{profile.followers}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-sm">Following</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{profile.following}</div>
            </CardContent>
          </Card>
        </div>

        {/* Repository Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Repositories</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRepos.map((repo) => (
                <Card key={repo.id} className="bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <a
                        href={`/${username}/${repo.name}`}
                        className="text-emerald-500 hover:text-emerald-400 hover:underline"
                      >
                        {repo.name}
                      </a>
                      <div className="flex items-center gap-3 text-sm text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {repo.stargazers_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="w-4 h-4" />
                          {repo.forks_count}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {repo.description && (
                      <p className="text-sm text-zinc-300">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      {repo.language && (
                        <span className="text-zinc-400">{repo.language}</span>
                      )}
                      <span className="text-zinc-500">
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}