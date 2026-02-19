# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files to custom directory
COPY --from=builder /app/dist /var/www/orbitx-admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
