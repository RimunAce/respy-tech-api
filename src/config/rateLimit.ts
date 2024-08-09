// Third-party imports
import rateLimit from 'express-rate-limit';
import { Response } from 'express';

// Local imports
import { Request } from '../types/openai';
import logger from '../utils/logger';

/**
 * Defines the structure for rate limit options.
 * @typedef {Object} RateLimitOptions
 * @property {number} windowMs - The time window in milliseconds for which requests are counted.
 * @property {number} max - The maximum number of requests allowed within the time window.
 * @property {string} message - The error message to send when the rate limit is exceeded.
 */
type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

/**
 * Creates a rate limiter based on the provided options.
 * 
 * @param {RateLimitOptions} options - The configuration options for the rate limiter.
 * @returns {RateLimit} A configured rate limiter middleware.
 */
const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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

/**
 * Rate limiter for chat completions endpoint.
 * Limits each IP to 15 requests per minute.
 */
export const chatCompletionsLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  message: 'You\'ve reached the rate limit for chat completions, please try again later.',
});

/**
 * Rate limiter for models endpoint.
 * Limits each IP to 50 requests per 5 minutes.
 */
export const modelsLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: 'You\'ve reached the rate limit for model queries, please try again later.',
});