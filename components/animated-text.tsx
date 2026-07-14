"use client"

import React, { useEffect, useState } from 'react'
import { cn } from "@/lib/utils"

interface AnimatedTextProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  onComplete?: () => void
  showCursor?: boolean
}

export function AnimatedText({
  text,
  className,
  speed = 50,
  delay = 0,
  onComplete,
  showCursor = true
}: AnimatedTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    let timeout: NodeJS.Timeout
    let currentIndex = 0
    
    // Reset if text changes
    setDisplayText('')
    setIsComplete(false)
    
    // Initial delay before starting animation
    timeout = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(intervalId)
          setIsComplete(true)
          if (onComplete) onComplete()
        }
      }, speed)
      
      return () => clearInterval(intervalId)
    }, delay)
    
    return () => clearTimeout(timeout)
  }, [text, speed, delay, onComplete])

  return (
    <div className={cn("w-full whitespace-nowrap overflow-visible font-['Chunk']", className)}>
      {displayText}
      {!isComplete && showCursor && (
        <span className="inline-block w-1 h-8 ml-1 bg-blue-500 animate-pulse" />
      )}
    </div>
  )
}