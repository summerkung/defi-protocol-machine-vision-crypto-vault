import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RepoSummaryProps {
  repoData: any
}

export default function RepoSummary({ repoData }: RepoSummaryProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>AI-generated summary of the repository</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-300">
            This is a billing management system built with React and Node.js. It provides functionality for managing
            customer subscriptions, processing payments, and generating invoices. The project uses a microservices
            architecture with separate services for authentication, billing, and notifications.
          </p>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Key Technologies:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">React</Badge>
              <Badge variant="secondary">Node.js</Badge>
              <Badge variant="secondary">Express</Badge>
              <Badge variant="secondary">MongoDB</Badge>
              <Badge variant="secondary">Stripe API</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Architecture</CardTitle>
          <CardDescription>How the project is structured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Frontend</h4>
              <p className="text-slate-600 dark:text-slate-300">
                React-based single-page application with Redux for state management. The UI is built using Material-UI
                components and custom styling.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Backend</h4>
              <p className="text-slate-600 dark:text-slate-300">
                Express.js API server with MongoDB for data storage. Authentication is handled using JWT tokens.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Key Files</h4>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">
                <li>
                  <code>server.js</code> - Main entry point for the backend
                </li>
                <li>
                  <code>src/App.js</code> - Main React component
                </li>
                <li>
                  <code>src/services/billing.js</code> - Handles billing logic
                </li>
                <li>
                  <code>src/components/Dashboard.js</code> - Main dashboard UI
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvement Suggestions</CardTitle>
          <CardDescription>AI-generated recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li className="flex gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500 flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Consider implementing TypeScript for better type safety and developer experience</span>
            </li>
            <li className="flex gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500 flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Add comprehensive test coverage with Jest and React Testing Library</span>
            </li>
            <li className="flex gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500 flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Implement rate limiting on API endpoints to prevent abuse</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

