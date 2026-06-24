/**
 * Deployment helper script
 * Starts the API server on port 8080
 * Frontend is pre-built and can be served from API or via static hosting
 */

import { spawn } from "child_process";
import path from "path";

const API_PORT = process.env.PORT || "8080";
const NODE_ENV = process.env.NODE_ENV || "production";

console.log(`Starting Intelligent Exam Guardian in ${NODE_ENV} mode...`);

// Ensure required environment variables
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set - database features will not work");
}

// Start the API server
const apiProcess = spawn("node", ["--enable-source-maps", "./dist/index.mjs"], {
  cwd: path.join(process.cwd(), "artifacts/api-server"),
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: API_PORT,
    NODE_ENV,
  },
});

apiProcess.on("error", (err) => {
  console.error("Failed to start API server:", err);
  process.exit(1);
});

apiProcess.on("exit", (code) => {
  console.log(`API server exited with code ${code}`);
  process.exit(code || 1);
});

// Handle termination
process.on("SIGTERM", () => {
  console.log("Terminating...");
  apiProcess.kill("SIGTERM");
});

process.on("SIGINT", () => {
  console.log("Interrupted");
  apiProcess.kill("SIGINT");
});
