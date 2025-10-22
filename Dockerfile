# Use the official Node.js 20 Alpine image as the base
FROM node:20-alpine AS base

# Install dependencies and build in the same stage for simplicity
FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Set environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build || (echo "Build failed, showing logs:" && cat /tmp/build.log 2>/dev/null || echo "No build log found" && exit 1)

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install cron and curl for scheduled tasks
RUN apk add --no-cache dcron curl

# Create cron log directory
RUN mkdir -p /var/log/cron && chown nextjs:nodejs /var/log/cron

# Create cron job file for nextjs user
RUN echo "*/5 * * * * curl -s http://localhost:3000/api/send-scheduled-emails >> /var/log/cron/scheduled-emails.log 2>&1" > /etc/crontabs/nextjs && \
    chown nextjs:nodejs /etc/crontabs/nextjs && \
    chmod 600 /etc/crontabs/nextjs

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'crond -f -l 8 &' >> /app/start.sh && \
    echo 'exec "$@"' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["/app/start.sh", "node", "server.js"]