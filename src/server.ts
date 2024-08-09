// Third-party imports
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

// Local imports
import { corsOptions } from './config/corsConfig';
import routes from './routes';
import logger, { logRequest, logResponse } from './utils/logger';
import { honeypotMiddleware, honeypotHandler } from './middleware/honeypotMiddleware';
import { originMiddleware } from './middleware/susOriginMiddleware';

/**
 * Creates and configures an Express server with various middleware and routes.
 * @returns {express.Application} Configured Express application
 */
export function createServer() {
  const app = express();

  // Apply honeypot middleware to catch potential attackers
  app.use(honeypotMiddleware);

  // Enable trust proxy to get correct client IP when behind a reverse proxy
  app.set('trust proxy', 1);

  // Apply CORS middleware with custom options
  app.use(cors(corsOptions));

  // Handle preflight requests for CORS
  app.options('*', cors(corsOptions));

  // Apply middleware to check for suspicious origins
  app.use(originMiddleware);

  // Apply Helmet middleware for setting various HTTP headers for security
  app.use(helmet());

  // Middleware to parse incoming JSON requests
  app.use(express.json({
    limit: '50mb', // Limit the size of incoming JSON payloads
    strict: true, // Enable strict mode for JSON parsing
  }));

  // Custom logging middleware for requests and responses
  app.use((req, res, next) => {
    logRequest(req); // Log the incoming request
    res.on('finish', () => logResponse(res)); // Log the response when it finishes
    next();
  });

  // Mount all routes
  app.use('/', routes);

  // Error handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({
      message: "Not Found. Where on earth are you going?"
    });
  });

  // Honeypot endpoint to catch potential attackers
  app.get('/system', honeypotHandler);

  // Global error handling middleware
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.message === 'Not allowed by CORS') {
      logger.error(`CORS Error: ${err.message}`);
      return res.status(403).json({ error: 'CORS policy violation', details: err.message });
    }
    next(err);
  });

  // Return the configured Express application
  return app;
}