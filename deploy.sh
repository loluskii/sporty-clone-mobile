#!/usr/bin/env bash

set -e

cd ~/west-zaza-mobile

echo "Building Docker image with server's .env file"
head -5 .env || echo "No .env file found"

sed -i 's/^`//g' .env
set -a
source .env
set +a

docker network create sbenet || true

docker stop west-zaza-mobile || true
docker rm west-zaza-mobile || true

docker compose down || true

docker compose up -d --build

docker ps

echo "Deployment completed successfully"
