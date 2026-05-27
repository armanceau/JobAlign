# syntax=docker/dockerfile:1.5
FROM node:18-bullseye-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

FROM nginx:1.26-alpine AS server
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]