#!/bin/bash

# Intelligent Exam Guardian - Deployment Script
# Supports: Replit, Docker, Local Server

set -e

echo "🚀 Intelligent Exam Guardian - Deployment Script"
echo "=================================================="

# Detect deployment environment
if [ -f "/.replit" ]; then
    DEPLOY_ENV="replit"
    echo "📍 Detected: Replit Environment"
elif command -v docker &> /dev/null; then
    DEPLOY_ENV="docker"
    echo "📍 Detected: Docker Environment"
else
    DEPLOY_ENV="local"
    echo "📍 Detected: Local/VPS Environment"
fi

# Check requirements
echo ""
echo "✓ Checking requirements..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 24+"
    exit 1
fi

if ! command -v pnpm &> /dev/null && ! command -v corepack &> /dev/null; then
    echo "❌ pnpm not found. Enabling corepack..."
    corepack enable
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 24 ]; then
    echo "❌ Node.js 24+ required, found v$NODE_VERSION"
    exit 1
fi

echo "✓ Node.js $(node -v)"
echo "✓ pnpm $(pnpm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run TypeScript checks
echo ""
echo "🔍 Running TypeScript checks..."
pnpm run typecheck

# Build the project
echo ""
echo "🔨 Building the project..."
pnpm run build

# Environment setup
echo ""
echo "⚙️  Setting up environment..."

if [ -z "$DATABASE_URL" ]; then
    if [ "$DEPLOY_ENV" = "replit" ]; then
        echo "ℹ️  DATABASE_URL not set. Replit will provide this automatically."
    else
        echo "⚠️  WARNING: DATABASE_URL not set."
        echo "   Set it before starting the server:"
        echo "   export DATABASE_URL='postgresql://user:pass@host/db'"
    fi
fi

if [ -z "$PORT" ]; then
    export PORT=8080
    echo "ℹ️  Using default PORT=$PORT"
fi

# Run database migrations
if [ -n "$DATABASE_URL" ]; then
    echo ""
    echo "🗄️  Running database migrations..."
    pnpm --filter @workspace/db run push || echo "⚠️  Migration failed - database might not be ready yet"
fi

# Start the application
echo ""
echo "✅ Ready to start!"
echo ""

case "$DEPLOY_ENV" in
    replit)
        echo "🚀 Starting on Replit..."
        echo "   API: http://localhost:$PORT"
        echo "   Dashboard: Check the Replit webview"
        ;;
    docker)
        echo "🐳 Docker deployment detected"
        echo "   Run: docker-compose up -d"
        ;;
    local)
        echo "🖥️  Starting local server..."
        echo "   API: http://localhost:$PORT"
        echo ""
        ;;
esac

# Start the API server
echo ""
echo "Starting API server on port $PORT..."
exec pnpm --filter @workspace/api-server run start
