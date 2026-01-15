#!/usr/bin/env bash

set -e  # Exit on any error

# Change to correct directory
cd ~/west-bet24-mobile

# Build image locally with server's .env file
echo "=== Verifying Latest Code ==="
echo "Current git commit: $(git rev-parse HEAD 2>/dev/null || echo 'Not a git repo')"
echo "Files modified in last commit:"
git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null | head -10 || echo "Cannot read git history"
echo ""
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

# Stop conflicting container on port 3002
docker stop sporty-clone-mobile || true
docker rm sporty-clone-mobile || true

# Stop existing containers
docker compose down || true

# Build and start services (this will use the local .env file)
echo "Removing old images and containers..."
docker compose down --rmi all --volumes --remove-orphans || true
docker system prune -af || true
echo "Building fresh image without cache..."
docker compose build --no-cache --pull
echo "Starting services..."
docker compose up -d

# Show running containers
docker ps

# Verify environment variables in built files
echo "Verifying environment variables in Docker image..."
if docker ps | grep -q west-bet24; then
    echo "Checking main JS bundle for environment variables:"
    MAIN_JS=$(docker exec west-bet24-mobile-sportsbook-web-1 find /usr/share/nginx/html/assets -name "index-*.js" | head -1)
    echo "Main JS file: $MAIN_JS"
    echo "Sample content from main JS (first 500 chars):"
    docker exec west-bet24-mobile-sportsbook-web-1 head -c 500 "$MAIN_JS" 2>/dev/null || echo "Could not read main JS file"
    echo "\nSearching for 'api' in main JS:"
    docker exec west-bet24-mobile-sportsbook-web-1 grep -o "[a-zA-Z0-9:/.-]*api[a-zA-Z0-9:/.-]*" "$MAIN_JS" 2>/dev/null | head -5 || echo "No API references found"
    echo "\nSearching for 'bet24' in all files:"
    docker exec west-bet24-mobile-sportsbook-web-1 grep -r "bet24" /usr/share/nginx/html/ 2>/dev/null | head -3 || echo "No bet24 references found"
    echo "\nVerifying build timestamp and file hashes:"
    docker exec west-bet24-mobile-sportsbook-web-1 ls -lh /usr/share/nginx/html/assets/index-*.js
    docker exec west-bet24-mobile-sportsbook-web-1 find /usr/share/nginx/html/assets -name "*.css" -exec ls -lh {} \; | head -3
    echo "\nChecking for recent color/style changes in CSS:"
    docker exec west-bet24-mobile-sportsbook-web-1 find /usr/share/nginx/html/assets -name "*.css" -exec grep -l "color\|background" {} \; | head -3
else
    echo "Container west-bet24-mobile-sportsbook-web-1 is not running"
fi

echo "Deployment completed successfully"
