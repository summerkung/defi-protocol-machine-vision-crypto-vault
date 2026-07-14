"use client"

import { useState } from "react"
import { Folder, File, ChevronDown, ChevronRight, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface FileNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileNode[]
}

interface RepoExplorerProps {
  repoData: {
    files: FileNode[]
  }
}

export default function RepoExplorer({ repoData }: RepoExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes
      .filter((node) => node.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((node) => {
        const isExpanded = expandedFolders.has(node.path)

        return (
          <div key={node.path} className="select-none">
            <div
              className={cn(
                "flex items-center py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer",
                level > 0 && "ml-4",
              )}
              onClick={() => node.type === "directory" && toggleFolder(node.path)}
            >
              {node.type === "directory" ? (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-1 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1 text-slate-500" />
                  )}
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                </>
              ) : (
                <>
                  <span className="w-4 mr-1" />
                  <File className="h-4 w-4 mr-2 text-slate-500" />
                </>
              )}
              <span className="text-sm truncate">{node.name}</span>
            </div>

            {node.type === "directory" && isExpanded && node.children && (
              <div>{renderFileTree(node.children, level + 1)}</div>
            )}
          </div>
        )
      })
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4 relative">
        <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-500" />
        <Input
          placeholder="Search files..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-4">{renderFileTree(repoData.files)}</div>
      </ScrollArea>
    </div>
  )
}

