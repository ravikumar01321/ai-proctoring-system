FROM node:24-alpine

WORKDIR /app

# Install pnpm via corepack
RUN corepack enable pnpm

# Copy workspace configuration files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig*.json ./
COPY .npmrc ./

# Copy all workspace packages (libs + artifacts)
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server
COPY artifacts/proctor-app/dist ./artifacts/proctor-app/dist

# Install dependencies (production only, no devDependencies)
RUN pnpm install --frozen-lockfile --prod

# Build the API server
WORKDIR /app/artifacts/api-server
RUN pnpm run build

# Return to app root and expose port
WORKDIR /app
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the API server
ENV NODE_ENV=production
ENV PORT=8080
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
