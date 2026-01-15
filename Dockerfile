FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_SITE_URL
ARG VITE_NEW_BASE_API
ARG VITE_ENCRYPT_SECRET_KEY
ARG VITE_APP_KEY
ARG VITE_CLIENT_ID
ARG VITE_CURRENCY
ARG VITE_WTH_PERC
ARG VITE_EXCISE_DUTY
ARG VITE_FAST_ADD_AMOUNTS
ARG VITE_TIMEZONE
ARG VITE_MaxCombinationsByGrouping
ARG VITE_MaxCouponCombinations
ARG VITE_MinBonusOdd
ARG VITE_MinGroupingsBetStake
ARG VITE_MaxGroupingsBetStake
ARG VITE_MinBetStake
ARG VITE_StakeInnerMod0Combination
ARG VITE_XPRESS_LAUNCH_URL
ARG VITE_XPRESS_PRIVATE_KEY
ARG VITE_XPRESS_PUBLIC_KEY
ARG VITE_MQTT_URI

# Set environment variables for build
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_NEW_BASE_API=$VITE_NEW_BASE_API
ENV VITE_ENCRYPT_SECRET_KEY=$VITE_ENCRYPT_SECRET_KEY
ENV VITE_APP_KEY=$VITE_APP_KEY
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
ENV VITE_CURRENCY=$VITE_CURRENCY
ENV VITE_WTH_PERC=$VITE_WTH_PERC
ENV VITE_EXCISE_DUTY=$VITE_EXCISE_DUTY
ENV VITE_FAST_ADD_AMOUNTS=$VITE_FAST_ADD_AMOUNTS
ENV VITE_TIMEZONE=$VITE_TIMEZONE
ENV VITE_MaxCombinationsByGrouping=$VITE_MaxCombinationsByGrouping
ENV VITE_MaxCouponCombinations=$VITE_MaxCouponCombinations
ENV VITE_MinBonusOdd=$VITE_MinBonusOdd
ENV VITE_MinGroupingsBetStake=$VITE_MinGroupingsBetStake
ENV VITE_MaxGroupingsBetStake=$VITE_MaxGroupingsBetStake
ENV VITE_MinBetStake=$VITE_MinBetStake
ENV VITE_StakeInnerMod0Combination=$VITE_StakeInnerMod0Combination
ENV VITE_XPRESS_LAUNCH_URL=$VITE_XPRESS_LAUNCH_URL
ENV VITE_XPRESS_PRIVATE_KEY=$VITE_XPRESS_PRIVATE_KEY
ENV VITE_XPRESS_PUBLIC_KEY=$VITE_XPRESS_PUBLIC_KEY
ENV VITE_MQTT_URI=$VITE_MQTT_URI

COPY package*.json ./
RUN rm -rf node_modules package-lock.json && \
    npm install && \
    npm install @rollup/rollup-linux-x64-musl --save-optional

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]