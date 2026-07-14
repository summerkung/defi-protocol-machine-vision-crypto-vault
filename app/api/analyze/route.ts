import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { username, repo, files, question } = await req.json()

    // In a real implementation, you would:
    // 1. Fetch the repository contents from GitHub API
    // 2. Process the files and create embeddings for efficient retrieval
    // 3. Use the AI to analyze the repository and answer questions

    const prompt = question || "Provide a summary of this repository and its architecture"

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `You are analyzing the GitHub repository ${username}/${repo}.
               ${files ? `The repository contains these files: ${JSON.stringify(files)}` : ""}
               ${prompt}`,
      maxTokens: 1000,
    })

    return Response.json({
      success: true,
      result: text,
    })
  } catch (error) {
    console.error("Error analyzing repository:", error)
    return Response.json(
      {
        success: false,
        error: "Failed to analyze repository",
      },
      {
        status: 500,
      },
    )
  }
}

