# Stage 1: Install dependencies
ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

COPY package*.json ./

RUN if [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "No lockfile found."; \
    exit 1; \
  fi


# Stage 2: Build TypeScript -> dist
FROM dependencies AS build

WORKDIR /app

COPY . .

RUN npm run build


# Stage 3: Production runtime (prod deps only, non-root user)
FROM node:${NODE_VERSION} AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
