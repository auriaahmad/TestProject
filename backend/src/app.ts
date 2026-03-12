import express from 'express';
import cors from 'cors';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestTimer } from './middleware/requestTimer.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { userRouter } from './routes/userRoutes.js';
import { cacheRouter } from './routes/cacheRoutes.js';

export function createApp(): express.Express {
  const app = express();

  // Built-in middleware
  app.use(express.json());
  app.use(cors());

  // Custom middleware
  app.use(requestTimer);
  app.use(requestLogger);
  app.use(rateLimiter);

  // Welcome route
  app.get('/', (_req, res) => {
    res.json({
      name: 'User Data API',
      endpoints: {
        'GET /users/:id': 'Retrieve user by ID (cached)',
        'POST /users': 'Create a new user',
        'DELETE /cache': 'Clear the cache',
        'GET /cache-status': 'Cache stats',
        'GET /metrics': 'API performance metrics',
      },
      try: 'GET /users/1',
    });
  });

  // Routes
  app.use('/users', userRouter);
  app.use(cacheRouter);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
