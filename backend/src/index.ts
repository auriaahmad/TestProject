import { createApp } from './app.js';
import { startCleanup, stopCleanup } from './services/lruCache.js';
import { startRateLimitCleanup, stopRateLimitCleanup } from './middleware/rateLimiter.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`User Data API running at http://localhost:${PORT}`);
  startCleanup();
  startRateLimitCleanup();
});

function gracefulShutdown(): void {
  console.log('\nShutting down gracefully...');
  stopCleanup();
  stopRateLimitCleanup();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
