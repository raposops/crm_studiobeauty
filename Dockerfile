FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Arguments for Next.js client environment
ARG NEXT_PUBLIC_SUPABASE_URL=https://zcfvfrslpvjubyuigiig.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU
ARG NEXT_PUBLIC_EVOLUTION_API_URL=https://evo.fidustecnologia.com.br
ARG NEXT_PUBLIC_EVOLUTION_API_KEY=9858375C8262-4CCB-83D2-E66974D498A1
ARG NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME=fidus

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_EVOLUTION_API_URL=$NEXT_PUBLIC_EVOLUTION_API_URL
ENV NEXT_PUBLIC_EVOLUTION_API_KEY=$NEXT_PUBLIC_EVOLUTION_API_KEY
ENV NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME=$NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME

# Next.js telemetry is disabled
ENV NEXT_TELEMETRY_DISABLED=1

# Run the build
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to 0.0.0.0 to listen on all interfaces inside container
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
