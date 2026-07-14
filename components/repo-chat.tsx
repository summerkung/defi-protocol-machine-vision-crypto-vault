"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { SendHorizontal, Bot, User } from "lucide-react"

interface RepoChatProps {
  username: string
  repo: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function RepoChat({ username, repo }: RepoChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'm your AI assistant for the ${username}/${repo} repository. Ask me anything about how this project works or how you might improve it.`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    // Store user input before clearing it
    const userInput = input
    const userMessage = { role: "user" as const, content: userInput }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Use our GitIngest-powered Gemini API
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          repo,
          query: userInput,
          history: messages, // Send conversation history for context
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error("Error generating response:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <Card
            key={index}
            className={`max-w-3xl ${message.role === "user" ? "ml-auto bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" : ""}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {message.role === "assistant" ? (
                  <Bot className="h-5 w-5 mt-1 text-blue-500 flex-shrink-0" />
                ) : (
                  <User className="h-5 w-5 mt-1 text-slate-500 flex-shrink-0" />
                )}
                <div className="text-sm leading-relaxed">{message.content}</div>
              </div>
            </CardContent>
          </Card>
        ))}

        {isLoading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Bot className="h-5 w-5 mt-1 text-blue-500 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse"></div>
                  <div
                    className="h-2.5 w-2.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                  <div
                    className="h-2.5 w-2.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.6s" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Ask about this repository..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 resize-none"
          rows={2}
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </form>
    </div>
  )
}

