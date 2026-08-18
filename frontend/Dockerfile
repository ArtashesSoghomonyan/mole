# syntax=docker/dockerfile:1

# =============================================================================
# Stage "base": shared Node tooling for the build stages
# =============================================================================
# Next.js 16 needs Node 20+. Node 22 (LTS) is a safe choice.
FROM node:22-alpine AS base

# pnpm v10 matches this repo's pnpm-lock.yaml / pnpm-workspace.yaml.
RUN npm install -g pnpm@10

WORKDIR /app

# =============================================================================
# Stage 1: deps — install node_modules from the lockfile
# =============================================================================
FROM base AS deps

# Copy only the package manifests so Docker can cache this layer and avoid
# re-downloading dependencies unless these files change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --frozen-lockfile -> install exactly what's in pnpm-lock.yaml (no updates)
RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: builder — compile the Next.js app
# =============================================================================
FROM base AS builder

# Reuse the node_modules produced in the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source.
COPY . .

# NEXT_PUBLIC_* variables are inlined into the browser JS bundle at BUILD
# time, so they must be available here (not at container runtime).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build the app. With "output: standalone" in next.config.ts this also
# produces a self-contained server in .next/standalone.
RUN pnpm build

# =============================================================================
# Stage 3: runner — minimal production image
# =============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Run the server as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy the standalone server output, plus static assets and public files.
# (The standalone output already bundles a minimal set of node_modules.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# The standalone server reads PORT and HOSTNAME to know where to listen.
ENV PORT=3000 \
    HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
