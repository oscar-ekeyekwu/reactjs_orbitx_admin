# Build stage
FROM node:20-alpine AS builder

# Vite reads VITE_* envs at BUILD time and inlines them into the bundle.
# Pass these as `--build-arg` when running `docker build`, e.g.:
#   docker build \
#     --build-arg VITE_API_URL=https://api.orbitxng.com/api/v1 \
#     -t orbitx-admin .
# Defaults match the production target so a plain `docker build` still works.
ARG VITE_API_URL=https://api.orbitxng.com/api/v1
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

WORKDIR /app

# Copy build to nginx default root
COPY --from=builder /app/dist /usr/share/nginx/html

# Patch default nginx config for SPA routing — unknown paths return index.html
# so React Router can handle them client-side.
RUN sed -i 's|try_files $uri $uri/ =404;|try_files $uri $uri/ /index.html;|' \
    /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]