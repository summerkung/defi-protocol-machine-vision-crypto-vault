# Use official Node.js image as base
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files first to leverage caching
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Build the application
RUN pnpm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy necessary files from builder
COPY --from=builder /app/package*.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Set environment variables
ARG GITHUB_TOKEN
ARG GEMINI_API_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_APP_URL

ENV GITHUB_TOKEN=$GITHUB_TOKEN
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
