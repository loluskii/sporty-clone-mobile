#!/usr/bin/env bash

set -e  # Exit on any error

# Change to correct directory
cd ~/west-bet24-mobile

# Build image locally with server's .env file
echo "Building Docker image with server's .env file"
echo "Checking .env file contents:"
head -5 .env || echo "No .env file found"
echo "Setting environment variables for build:"
export $(grep -v '^#' .env | xargs)

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
    echo "Checking main JS bundle for environment variables:"
    MAIN_JS=$(docker exec sporty-clone-mobile find /usr/share/nginx/html/assets -name "index-*.js" | head -1)
    echo "Main JS file: $MAIN_JS"
    echo "Sample content from main JS (first 500 chars):"
    docker exec sporty-clone-mobile head -c 500 "$MAIN_JS" 2>/dev/null || echo "Could not read main JS file"
    echo "\nSearching for 'api' in main JS:"
    docker exec sporty-clone-mobile grep -o "[a-zA-Z0-9:/.-]*api[a-zA-Z0-9:/.-]*" "$MAIN_JS" 2>/dev/null | head -5 || echo "No API references found"
    echo "\nSearching for 'cubebet' in all files:"
    docker exec sporty-clone-mobile grep -r "cubebet" /usr/share/nginx/html/ 2>/dev/null | head -3 || echo "No cubebet references found"
    echo "\nSearching for server's API URL in built files:"
    docker exec sporty-clone-mobile grep -r "api.cubebet.ng" /usr/share/nginx/html/ 2>/dev/null | head -3 || echo "Server API URL not found in built files"
else
    echo "Container sporty-clone-mobile is not running"
fi

echo "Deployment completed successfully"

     
