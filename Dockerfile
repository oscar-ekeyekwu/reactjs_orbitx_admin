# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy bundle to nginx default root.
COPY --from=builder /app/dist /usr/share/nginx/html

# Patch default nginx config for SPA routing — unknown paths return index.html
# so React Router can handle them client-side.
RUN sed -i 's|try_files $uri $uri/ =404;|try_files $uri $uri/ /index.html;|' \
    /etc/nginx/conf.d/default.conf

# Runtime config injection. nginx:alpine runs every /docker-entrypoint.d/*.sh
# before starting nginx, so this generates /config.js from env vars at
# container start. Change API_URL in the host's .env, restart the container,
# the SPA picks up the new URL on next page load. No rebuild required.
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
