# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy build to nginx default root
COPY --from=builder /app/dist /usr/share/nginx/html

# Patch default nginx config for SPA routing
RUN sed -i 's|try_files $uri $uri/ =404;|try_files $uri $uri/ /index.html;|' \
    /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]