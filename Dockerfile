FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN rm -rf node_modules package-lock.json && \
    npm install && \
    npm install @rollup/rollup-linux-x64-musl --save-optional

COPY . .
RUN --mount=type=secret,id=envfile,dst=.env \
    npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3007

CMD ["nginx", "-g", "daemon off;"]