# Etapa 1 — Build
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json .
RUN npm ci

# Copiar el código y compilar
COPY . .
RUN npm run build -- --configuration production

# Etapa 2 — Nginx
FROM nginx:alpine AS runtime

COPY --from=build /app/dist/auth-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80