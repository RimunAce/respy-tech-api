import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

// Define a type for rate limit options
type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

// Create a function to generate a rate limiter
const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: {
          message: options.message,
          statusCode: 429,
        },
      });
    },
  });
};

// Define rate limiters for different routes
export const chatCompletionsLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // Limit each IP to 15 requests per minute
  message: 'You\'ve reached the rate limit, please try again later.',
});

export const modelsLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 requests per 5 minutes
  message: 'You\'ve reached the rate limit, please try again later.',
});

// Add more rate limiters for other routes as needed