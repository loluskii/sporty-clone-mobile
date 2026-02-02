FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_BASE_URL
ARG VITE_NEW_BASE_API
ARG VITE_CLIENT_ID
ARG VITE_CURRENCY

# Set environment variables for build
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_NEW_BASE_API=$VITE_NEW_BASE_API
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
ENV VITE_CURRENCY=$VITE_CURRENCY

COPY package*.json ./
RUN rm -rf node_modules package-lock.json && \
    npm install && \
    npm install @rollup/rollup-linux-x64-musl --save-optional

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server {
    listen 3007;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3007

CMD ["nginx", "-g", "daemon off;"]