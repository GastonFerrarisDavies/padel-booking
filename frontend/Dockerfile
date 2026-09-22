# Stage 1: Dependencies installation.

ARG NODE_VERSION=24.13.0

FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

COPY package*.json ./

RUN if [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "No lockfile found."; \
    exit 1; \
  fi


# Stage 2: Build the static site (next.config.mjs: output "export" -> /app/out).

FROM dependencies AS build

WORKDIR /app

COPY . .

ENV NODE_ENV=production

# NEXT_PUBLIC_* se inyecta en build time (export estático). Vacío => default "/api".
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build


# Stage 3: Serve the static files with nginx.

FROM nginx:alpine AS production

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
