# Deployment Guide - Intelligent Exam Guardian

This guide covers deploying the AI Proctoring System to various platforms.

## Quick Start (Replit)

The project is pre-configured for **Replit** deployment:

1. **Build the project**: `pnpm run build`
2. **Set environment variables**:
   - `DATABASE_URL` - PostgreSQL connection string (Replit provides this automatically)
   - `PORT` - API server port (default: 8080)
3. **Start the server**: Click the "Project" run button or manually execute:
   ```bash
   PORT=8080 NODE_ENV=production pnpm --filter @workspace/api-server run start
   ```

### Replit Database Setup

1. In Replit console, the PostgreSQL 16 database is automatically available
2. Migrate the database schema:
   ```bash
   DATABASE_URL="postgresql://..." pnpm --filter @workspace/db run push
   ```

## Deployment Options

### Option 1: Docker (Recommended for Production)

Create a `Dockerfile` at the project root:

```dockerfile
FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig*.json ./

# Copy lib packages
COPY lib ./lib

# Copy api-server
COPY artifacts/api-server ./artifacts/api-server

# Copy proctor-app frontend
COPY artifacts/proctor-app/dist ./artifacts/proctor-app/dist

# Install dependencies (production only)
RUN pnpm install --frozen-lockfile --prod

# Build API server
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Expose port
EXPOSE 8080

# Start API server
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
```

Build and run:
```bash
docker build -t exam-guardian .
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e PORT=8080 \
  exam-guardian
```

### Option 2: Vercel (API Only)

1. Deploy API server to Vercel:
   ```bash
   cd artifacts/api-server
   vercel deploy
   ```

2. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NODE_ENV=production`

3. Deploy frontend separately (see Option 3)

### Option 3: Vercel (Frontend)

Deploy the built proctor-app to Vercel:

```bash
# Build proctor-app
PORT=4173 BASE_PATH='/' pnpm --filter @workspace/proctor-app run build

# Deploy dist/public folder to Vercel
cd artifacts/proctor-app/dist/public
vercel deploy
```

Configure frontend `.env.production` to point to your API:
```env
VITE_API_URL=https://your-api.vercel.app
```

### Option 4: Traditional VPS/Server

1. **Prerequisites**:
   - Node.js 24+
   - PostgreSQL 16+
   - pnpm

2. **Deploy**:
   ```bash
   git clone <repo> /opt/exam-guardian
   cd /opt/exam-guardian
   
   # Install dependencies
   pnpm install --prod
   
   # Build
   pnpm run build
   
   # Set environment variables
   export DATABASE_URL="postgresql://user:password@localhost/exam-guardian"
   export NODE_ENV=production
   export PORT=8080
   
   # Start with process manager (PM2)
   pm2 start "pnpm --filter @workspace/api-server run start" --name api-server
   
   # Serve frontend with nginx
   sudo cp -r artifacts/proctor-app/dist/public/* /var/www/html/
   ```

3. **Configure Nginx**:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location /api {
       proxy_pass http://localhost:8080;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
     
     location / {
       alias /var/www/html/;
       try_files $uri $uri/ /index.html;
     }
   }
   ```

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Replit: Automatically provided
  
- `PORT` - API server port (default: 8080)

### Optional
- `NODE_ENV` - Set to `production` for deployment (default: development)
- `LOG_LEVEL` - Pino logger level: `trace`, `debug`, `info`, `warn`, `error`

## Database Migrations

Before starting the server, push the schema:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @workspace/db run push
```

This creates all required tables for:
- Users
- Exams
- Questions
- Answers
- Results
- Enrollments
- Violations
- Activity logs

## Project Structure for Deployment

```
Intelligent-Exam-Guardian/
├── artifacts/
│   ├── api-server/           # Express API backend
│   │   └── dist/
│   │       └── index.mjs     # Production entry point
│   │
│   ├── proctor-app/          # React frontend (built)
│   │   └── dist/
│   │       └── public/       # Serve these files
│   │
│   └── mockup-sandbox/       # UI component library
│
├── lib/                       # Shared libraries
│   ├── db/                    # Database schemas
│   ├── api-zod/              # Validation schemas
│   ├── api-client-react/     # API client hooks
│   └── api-spec/             # OpenAPI specification
│
└── package.json              # Workspace configuration
```

## Post-Deployment Checklist

- [ ] Database migrations completed successfully
- [ ] `DATABASE_URL` environment variable configured
- [ ] API server running on correct port
- [ ] Frontend pointing to correct API endpoint
- [ ] CORS configured if frontend and API on different domains
- [ ] HTTPS enabled (via nginx, Vercel, or Replit)
- [ ] Health check endpoint responding: `GET /api/health`

## Monitoring

The API server logs are handled by **Pino** (structured JSON logging):

```bash
# View logs (on Replit console)
# Or forward logs to monitoring service
export LOG_LEVEL=info
```

## Rollback Procedure

1. Keep previous builds tagged in version control
2. If deployment fails, revert to last known good build
3. Database schema can be rolled back using Drizzle migrations

## Support & Troubleshooting

- **Port already in use**: Change `PORT` env var or kill existing process
- **Database connection fails**: Verify `DATABASE_URL` format and connectivity
- **Build fails**: Ensure Node.js 24+ and pnpm 11.9.0+
- **Frontend not loading**: Check CORS settings in API and CDN caching
