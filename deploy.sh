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
    echo "Checking for API URLs in built files:"
    docker exec sporty-clone-mobile find /usr/share/nginx/html/assets -name "*.js" -exec grep -l "https://api" {} \; | head -3
    echo "Sample API URLs found:"
    docker exec sporty-clone-mobile find /usr/share/nginx/html/assets -name "*.js" -exec grep -o "https://api[^\"']*" {} \; | head -5
    echo "Checking for specific domains:"
    docker exec sporty-clone-mobile find /usr/share/nginx/html/assets -name "*.js" -exec grep -o "[^\"']*cubebet[^\"']*\|[^\"']*bwinners[^\"']*\|[^\"']*sportsbookengine[^\"']*" {} \; | head -5
else
    echo "Container sporty-clone-mobile is not running"
fi

echo "Deployment completed successfully"

     
