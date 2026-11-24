# One container serves the React site and the PHP API (same origin: no CORS, cookies just work).
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM php:8.2-cli-alpine
RUN apk add --no-cache ca-certificates && docker-php-ext-install pdo_mysql
WORKDIR /app
COPY backend/ ./backend/
COPY --from=web /web/dist ./dist
ENV APP_ENV=production DB_SSL=1 PHP_CLI_SERVER_WORKERS=4
EXPOSE 10000
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} -t /app/dist /app/backend/prod_router.php"]
