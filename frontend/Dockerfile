FROM node:20 AS builder

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27.0-alpine

RUN apk add --no-cache tini

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["nginx", "-g", "daemon off; master_process off;"]
STOPSIGNAL SIGQUIT
EXPOSE 80
