#!/usr/bin/env bash

set -e  # Exit on any error

# Change to correct directory
cd ~/west-bet24-mobile

# Build image locally with server's .env file
echo "Building Docker image with server's .env file"

# Create network if it doesn't exist,
docker network create sbenet || true

# Stop existing containers
docker compose down || true

# Build and start services (this will use the local .env file)
docker compose up -d --build

# Show running containers
docker ps

# Verify environment variables in built files
echo "Verifying environment variables in Docker image..."
if docker ps | grep -q sporty-clone-mobile; then
    docker exec sporty-clone-mobile grep -r "api\." /usr/share/nginx/html/assets/ || echo "No API URLs found in built files"
    docker exec sporty-clone-mobile grep -r "cubebet\|bwinners\|sportsbookengine" /usr/share/nginx/html/assets/ || echo "No specific API domains found"
else
    echo "Container sporty-clone-mobile is not running"
fi

echo "Deployment completed successfully"

     
