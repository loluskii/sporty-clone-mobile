#!/usr/bin/env bash

set -e  # Exit on any error

# Change to correct directory
cd ~/west-betcruz-mobile

# Build image locally with server's .env file
echo "Building Docker image with server's .env file"
echo "Checking .env file contents:"
head -5 .env || echo "No .env file found"
echo "Setting environment variables for build:"
# Clean .env file of any invalid characters
sed -i 's/^`//g' .env
set -a
source .env
set +a
echo "All environment variables loaded:"
env | grep ^VITE_ || echo "No VITE environment variables found"

# Create network if it doesn't exist
docker network create sbenet || true

# Stop any existing app container already bound to this deployment port.
HOST_PORT="${HOST_PORT:-3007}"
PORT_CONTAINERS=$(docker ps --filter "publish=${HOST_PORT}" -q || true)
if [ -n "$PORT_CONTAINERS" ]; then
    echo "Stopping containers currently using port ${HOST_PORT}: ${PORT_CONTAINERS}"
    docker stop $PORT_CONTAINERS || true
    docker rm $PORT_CONTAINERS || true
fi

# Stop legacy container names from older deploy scripts
docker stop sporty-clone-mobile || true
docker rm sporty-clone-mobile || true

# Stop existing containers
docker compose down --remove-orphans || true

# Build and start services (this will use the local .env file)
docker compose up -d --build

# Show running containers
docker ps

# Verify environment variables in built files
echo "Verifying environment variables in Docker image..."
if docker ps | grep -q west-betcruz; then
    echo "Checking main JS bundle for environment variables:"
    MAIN_JS=$(docker exec west-betcruz-mobile-sportsbook-web-1 find /usr/share/nginx/html/assets -name "index-*.js" | head -1)
    echo "Main JS file: $MAIN_JS"
    echo "Sample content from main JS (first 500 chars):"
    docker exec west-betcruz-mobile-sportsbook-web-1 head -c 500 "$MAIN_JS" 2>/dev/null || echo "Could not read main JS file"
    echo "\nSearching for 'api' in main JS:"
    docker exec west-betcruz-mobile-sportsbook-web-1 grep -o "[a-zA-Z0-9:/.-]*api[a-zA-Z0-9:/.-]*" "$MAIN_JS" 2>/dev/null | head -5 || echo "No API references found"
    echo "\nSearching for 'bet24' in all files:"
    docker exec west-betcruz-mobile-sportsbook-web-1 grep -r "bet24" /usr/share/nginx/html/ 2>/dev/null | head -3 || echo "No bet24 references found"
    echo "\nSearching for server's API URL in built files:"
    docker exec west-betcruz-mobile-sportsbook-web-1 grep -r "https://fixture-prod.sportsbookengine.com/docs//index.html#/" /usr/share/nginx/html/ 2>/dev/null | head -3 || echo "Server API URL not found in built files"
else
    echo "Container west-betcruz-mobile-sportsbook-mobile-1 is not running"
fi

echo "Deployment completed successfully"
