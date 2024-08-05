// Third-party imports
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Local imports
import { corsOptions } from './config/corsConfig';
import v1Router from './routes/v1';
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

  // Configure and apply rate limiting middleware
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 15, // Limit each IP to 15 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res) => {
      res.status(429).json({
        error: {
          message: 'Rate limit exceeded. Please wait a moment before retrying.',
          statusCode: 429,
        },
      });
    },
  });
  app.use(limiter);

  // Middleware to parse incoming JSON requests
  app.use(express.json({
    limit: '10mb', // Limit the size of incoming JSON payloads
    strict: true, // Enable strict mode for JSON parsing
  }));

  // Custom logging middleware for requests and responses
  app.use((req, res, next) => {
    logRequest(req); // Log the incoming request
    res.on('finish', () => logResponse(res)); // Log the response when it finishes
    next();
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to Respy.Tech API. This is an Invite Only project.',
      howToAccess: 'To request access, please contact me on Discord: respire (188610034849021952)',
      alternativeOption: 'Alternatively, you can clone this open-source API from our GitHub repository and run your own server locally. Visit https://github.com/rimunace/respy-tech-api for instructions.'
    });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Mount the v1 router on the '/v1' path
  app.use('/v1', v1Router);

  // Endpoint to list available v1 endpoints
  app.get('/v1', (req, res) => {
    res.json({
      endpoints: [
        '/v1/models',
        '/v1/chat/completions'
      ]
    });
  });

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