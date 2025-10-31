FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_BASE_URL
ARG VITE_NEW_BASE_API
ARG VITE_APP_KEY
ARG VITE_CLIENT_ID
ARG VITE_CURRENCY
ARG VITE_MQTT_URI

# Set environment variables for build
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_NEW_BASE_API=$VITE_NEW_BASE_API
ENV VITE_APP_KEY=$VITE_APP_KEY
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
ENV VITE_CURRENCY=$VITE_CURRENCY
ENV VITE_MQTT_URI=$VITE_MQTT_URI

# Debug: Show environment variables during build
RUN echo "Build-time environment variables:"
RUN echo "VITE_BASE_URL=$VITE_BASE_URL"
RUN echo "VITE_NEW_BASE_API=$VITE_NEW_BASE_API"

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build with environment variables
RUN npm run build

FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built app and nginx config
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]