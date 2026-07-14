'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Github, Code, MessageSquare } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { EnhancedLoading } from "@/components/enhanced-loading"
import { AnimatedText } from "@/components/animated-text"

export default function Home() {
  const router = useRouter()
  const [repoUrl, setRepoUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loadingText, setLoadingText] = useState("Analyzing Repository...") // New state for loading text
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleAnalyze = async () => { // Make handleAnalyze async
    // Extract username and repo from the URL
    const urlPattern = /(?:github\.com\/)(([-\w.]+)\/([-\w.]+))/
    const match = repoUrl.match(urlPattern)

    let username: string | null = null;
    let repo: string | null = null;

    if (match) {
      [, , username, repo] = match
    } else {
      // If URL doesn't match pattern, check if it contains any text and try to extract username/repo
      const simplifiedPattern = /(([-\w.]+)\/([-\w.]+))/
      const simplifiedMatch = repoUrl.match(simplifiedPattern)
      
      if (simplifiedMatch) {
        [, , username, repo] = simplifiedMatch
      } else if (repoUrl.trim() !== '') {
        // If no pattern matches but there is text, alert the user
        alert('Please enter a valid GitHub repository URL or username/repository format')
        return;
      } else {
        // If empty, alert the user
        alert('Please enter a GitHub repository URL')
        return;
      }
    }

    if (username && repo) {
      setIsAnalyzing(true)
      setLoadingText("Fetching Repository Data...")

      try {
        // First, trigger GitIngest analysis
        setLoadingText("Analyzing repository with GitIngest...");
        const gitIngestResponse = await fetch('/api/collect-repo-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, repo, force: true }), // force: true to ensure fresh fetch
        });

        const gitIngestResult = await gitIngestResponse.json();

        if (!gitIngestResponse.ok) {
          throw new Error(gitIngestResult.error || 'Failed to analyze repository with GitIngest');
        }

        setLoadingText("Repository analyzed successfully!");
        
        // Add a small delay to show success message before navigating
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navigate to the repository page
        router.push(`/${username}/${repo}`);
      } catch (error) {
        console.error('Failed to analyze repository:', error);
        alert(error instanceof Error ? error.message : 'Failed to analyze repository');
        setIsAnalyzing(false);
        setLoadingText("Analyzing Repository..."); // Reset loading text
      } 
    }    
    // Log for debugging
    console.log('Analyze button clicked', { repoUrl })
  }
  
  // Handle Enter key press in the input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent default form submission
      console.log('Enter key pressed')
      handleAnalyze()
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section with Immersive Background */}
      <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Animated background particles */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-6000"></div>
        </div>
        <div className="max-w-3xl w-full text-center flex flex-col justify-center items-center h-full space-y-16">
          {isAnalyzing ? (
            <div className="flex items-center justify-center min-h-[200px]">
              {/* Use EnhancedLoading component with dynamic text */}
              <EnhancedLoading loadingText={loadingText} />
            </div>
          ) : (
            <>
              <div className="space-y-6 animate-fade-in pt-24">
                <div className="flex flex-col items-center">
                  <AnimatedText 
                    text="Understand Github repositories" 
                    className="text-7xl font-bold tracking-tight text-blue-600 dark:text-blue-500 mb-2 font-chunk" 
                    speed={40}
                    showCursor={true}
                  />
                  <AnimatedText 
                    text="in seconds" 
                    className="text-7xl font-bold tracking-tight text-blue-600 dark:text-blue-500 font-chunk" 
                    speed={40}
                    delay={1500}
                    showCursor={false}
                  />
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-300 animate-fade-in-up" style={{ animationDelay: '1s' }}>
                  Instantly analyze, understand, and improve any GitHub project with AI-powered insights.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 max-w-xl w-full mx-auto animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <Input 
                  placeholder="github.com/username/repository" 
                  className="flex-1 border-2 focus:border-blue-500 transition-all z-10" 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={handleKeyPress}
                  ref={inputRef}
                  autoFocus
                  onPaste={(e) => {
                    e.stopPropagation()
                    const pastedText = e.clipboardData.getData('text')
                  }}
                />
                <Button 
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg px-6 py-6 sm:py-2 text-base font-medium z-10" 
                  onClick={handleAnalyze}
                  type="button"
                  aria-label="Analyze Repository"
                >
                  Analyze Repository <ArrowRight size={16} />
                </Button>
              </div>

              <div className="pt-4 text-sm text-slate-500 dark:text-slate-400 animate-fade-in-up whitespace-nowrap overflow-x-auto px-2" style={{ animationDelay: '2s' }}>
                Example: github.com/TharaneshA/nlsql → answersforgit.vercel.app/TharaneshA/nlsql
              </div>
            </>
          )}
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Repository Analysis Card */}
            <div className="group bg-slate-50 dark:bg-slate-900 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-500/30 relative overflow-hidden">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon with animation */}
              <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-5 transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <Github className="text-blue-600 dark:text-blue-400 h-7 w-7" />
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 relative z-10">Repository Analysis</h3>
              
              <p className="text-slate-600 dark:text-slate-300 text-sm relative z-10">
                Our AI scans the entire repository structure, code, and documentation to build a comprehensive
                understanding of your project's architecture and dependencies.
              </p>
              
              {/* Animated arrow on hover */}
              <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300 relative z-10">
                <span className="text-sm font-medium">Learn more</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>

            {/* Smart Insights Card */}
            <div className="group bg-slate-50 dark:bg-slate-900 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-transparent hover:border-purple-500/30 relative overflow-hidden">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon with animation */}
              <div className="h-14 w-14 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-5 transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600 dark:text-purple-400"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 relative z-10">Smart Insights</h3>
              
              <p className="text-slate-600 dark:text-slate-300 text-sm relative z-10">
                Get detailed explanations about project structure, dependencies, and how different components interact with each other in your codebase.
              </p>
              
              {/* Animated arrow on hover */}
              <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300 relative z-10">
                <span className="text-sm font-medium">Learn more</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>

            {/* Code Navigation Card */}
            <div className="group bg-slate-50 dark:bg-slate-900 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-transparent hover:border-emerald-500/30 relative overflow-hidden">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon with animation */}
              <div className="h-14 w-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center mb-5 transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-600 dark:text-emerald-400"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 relative z-10">Code Navigation</h3>
              
              <p className="text-slate-600 dark:text-slate-300 text-sm relative z-10">
                Easily navigate through the codebase with our interactive file explorer and get instant explanations for any part of your project.
              </p>
              
              {/* Animated arrow on hover */}
              <div className="mt-4 flex items-center text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300 relative z-10">
                <span className="text-sm font-medium">Learn more</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </div>
          
          {/* Additional Features Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-10 text-slate-800 dark:text-slate-200">Additional Features</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="flex items-start space-x-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors duration-300">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">Code Explanations</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Get detailed explanations of complex code sections with examples and best practices.</p>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className="flex items-start space-x-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors duration-300">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">AI Chat Assistant</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Ask questions about the repository and get instant, contextual answers from our AI.</p>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className="flex items-start space-x-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors duration-300">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">Dependency Analysis</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Understand how different parts of your codebase depend on each other with visual graphs.</p>
                </div>
              </div>
              
              {/* Feature 4 */}
              <div className="flex items-start space-x-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors duration-300">
                <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600 dark:text-pink-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">Documentation Generation</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Automatically generate comprehensive documentation for your project with a single click.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

