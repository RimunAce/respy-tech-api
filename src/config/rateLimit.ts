// Third-party imports
import rateLimit from 'express-rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Response, NextFunction } from 'express';

// Local imports
import { Request, ApiKey } from '../types/openai';
import logger from '../utils/logger';

/**
 * Defines the structure for rate limit options.
 */
type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

/**
 * Creates an IP-based rate limiter using express-rate-limit.
 * 
 * @param options - The options for configuring the rate limiter
 * @returns An instance of the express-rate-limit middleware
 */
const createIpRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`IP-based rate limit exceeded for IP: ${req.ip}`);
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
 * Stores rate limiters for each API key.
 */
const keyLimiters = new Map<string, RateLimiterMemory>();

/**
 * Middleware for implementing key-based rate limiting.
 * 
 * This function checks the API key's usage limit and enforces
 * rate limiting based on that limit. If the key has no limit
 * or an 'unlimited' limit, it allows the request to proceed.
 * 
 * @param req - The Express request object
 * @param res - The Express response object
 * @param next - The next middleware function
 */
export const keyBasedRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.apiKeyInfo as ApiKey;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const usageLimit = parseInt(apiKey.raw_data.usage_limit);
  if (isNaN(usageLimit) || apiKey.raw_data.usage_limit === 'unlimited') {
    return next();
  }

  let limiter = keyLimiters.get(apiKey.id);
  if (!limiter) {
    limiter = new RateLimiterMemory({
      points: usageLimit,
      duration: 60, // 1 minute
    });
    keyLimiters.set(apiKey.id, limiter);
  }

  limiter.consume(apiKey.id)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Key-based rate limit exceeded for key: ${apiKey.id}`);
      res.status(429).json({
        error: {
          message: 'Rate limit exceeded for this API key',
          statusCode: 429,
        },
      });
    });
};

/**
 * Rate limiter for model queries.
 * 
 * This limiter is applied globally based on IP address.
 * It allows 50 requests per 5-minute window for each IP.
 */
export const modelsLimiter = createIpRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: 'You\'ve reached the rate limit for model queries, please try again later.',
});