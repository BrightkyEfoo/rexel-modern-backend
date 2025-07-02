ARG NODE_IMAGE=node:22-alpine

FROM $NODE_IMAGE AS base

# All deps stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Production only deps stage
FROM base AS production-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN node ace build

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app

# # Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#   CMD curl -f http://localhost:3333/health || exit 1

EXPOSE 3333

CMD ["node", "bin/server.js"]
# CMD ["sh", "-c", "while :; do sleep 2073600; done"]