# Intelligent Exam Guardian - Windows Deployment Helper
# Run: .\deploy.ps1

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("replit", "docker", "local", "vercel", "vps")]
    [string]$DeploymentType = "local",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "8080",
    
    [Parameter(Mandatory=$false)]
    [string]$NodeEnv = "production"
)

Write-Host ""
Write-Host "🚀 Intelligent Exam Guardian - Deployment Helper" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Verify Node.js and pnpm
Write-Host "✓ Checking requirements..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js 24+" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "  Node.js: $nodeVersion"

try {
    $pnpmVersion = corepack pnpm --version 2>$null
    Write-Host "  pnpm: $pnpmVersion"
} catch {
    Write-Host "⚠️  pnpm not found, enabling via corepack..."
    corepack enable
}

Write-Host ""
Write-Host "📦 Installing dependencies..."
corepack pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Install failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Running TypeScript checks..."
corepack pnpm run typecheck:libs

Write-Host ""
Write-Host "🔨 Building project..."
$env:PORT = $Port
$env:BASE_PATH = "/"
corepack pnpm -r --if-present run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Deployment instructions based on type
switch ($DeploymentType) {
    "local" {
        Write-Host "🖥️  LOCAL DEPLOYMENT" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To start the API server locally:"
        Write-Host ""
        Write-Host "  `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/exam_guardian'" -ForegroundColor Yellow
        Write-Host "  `$env:PORT='$Port'" -ForegroundColor Yellow
        Write-Host "  `$env:NODE_ENV='$NodeEnv'" -ForegroundColor Yellow
        Write-Host "  corepack pnpm --filter @workspace/api-server run start" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Frontend is at: artifacts/proctor-app/dist/public/"
        Write-Host ""
        if ($DatabaseUrl) {
            Write-Host "Starting with provided database URL..."
            $env:DATABASE_URL = $DatabaseUrl
            $env:PORT = $Port
            $env:NODE_ENV = $NodeEnv
            corepack pnpm --filter @workspace/api-server run start
        }
    }
    
    "docker" {
        Write-Host "🐳 DOCKER DEPLOYMENT" -ForegroundColor Cyan
        Write-Host ""
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            Write-Host "Starting Docker Compose stack..."
            Write-Host ""
            docker-compose up -d
            Write-Host ""
            Write-Host "✅ Deployment started!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Access points:"
            Write-Host "  • API: http://localhost:8080" -ForegroundColor Green
            Write-Host "  • Frontend: http://localhost" -ForegroundColor Green
            Write-Host "  • Nginx Proxy: http://localhost" -ForegroundColor Green
            Write-Host ""
            Write-Host "To view logs:"
            Write-Host "  docker-compose logs -f api" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "To stop:"
            Write-Host "  docker-compose down" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Docker not found. Install Docker Desktop:" -ForegroundColor Red
            Write-Host "   https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        }
    }
    
    "replit" {
        Write-Host "🌐 REPLIT DEPLOYMENT" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "The project is pre-configured for Replit!"
        Write-Host ""
        Write-Host "Steps:"
        Write-Host "  1. Push to your Replit repository"
        Write-Host "  2. Environment variables are auto-configured"
        Write-Host "  3. Click the 'Project' run button"
        Write-Host "  4. Access at: https://your-username.replit.dev"
        Write-Host ""
        Write-Host ".replit configuration:"
        Write-Host "  • Modules: Node.js 24, PostgreSQL 16"
        Write-Host "  • Deployment: autoscale"
        Write-Host "  • Post-build: pnpm store prune"
        Write-Host ""
        Write-Host "See DEPLOYMENT.md for more details."
    }
    
    "vercel" {
        Write-Host "⚡ VERCEL DEPLOYMENT" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Deploy API Server to Vercel:"
        Write-Host "  cd artifacts/api-server" -ForegroundColor Yellow
        Write-Host "  vercel deploy" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Deploy Frontend to Vercel:"
        Write-Host "  cd artifacts/proctor-app/dist/public" -ForegroundColor Yellow
        Write-Host "  vercel deploy" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Set environment variables in Vercel dashboard:"
        Write-Host "  • DATABASE_URL = your PostgreSQL connection" -ForegroundColor Yellow
        Write-Host "  • NODE_ENV = production" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "See DEPLOYMENT.md for Vercel setup details."
    }
    
    "vps" {
        Write-Host "🖥️  VPS DEPLOYMENT (AWS, DigitalOcean, etc.)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Manual server deployment guide:"
        Write-Host ""
        Write-Host "1. SSH into your server"
        Write-Host "2. Clone the repository"
        Write-Host "3. Install Node.js 24+ and PostgreSQL 16"
        Write-Host "4. Run:"
        Write-Host ""
        Write-Host "   pnpm install --prod" -ForegroundColor Yellow
        Write-Host "   pnpm run build" -ForegroundColor Yellow
        Write-Host "   export DATABASE_URL='postgresql://...'" -ForegroundColor Yellow
        Write-Host "   export NODE_ENV=production" -ForegroundColor Yellow
        Write-Host "   export PORT=8080" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "5. Use PM2 for process management:"
        Write-Host "   npm install -g pm2" -ForegroundColor Yellow
        Write-Host "   pm2 start 'pnpm --filter @workspace/api-server run start'" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "6. Configure Nginx as reverse proxy"
        Write-Host "7. Set up SSL with Let's Encrypt"
        Write-Host ""
        Write-Host "See DEPLOYMENT.md for complete VPS setup."
    }
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  • DEPLOYMENT_READY.md - Full deployment guide"
Write-Host "  • DEPLOYMENT.md - Detailed deployment options"
Write-Host ""
