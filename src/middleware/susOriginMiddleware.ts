import express from 'express';
import logger from '../utils/logger';

/**
 * Define suspicious patterns as an array of RegExp objects.
 * These patterns are used to identify potentially malicious origins.
 */
const suspiciousPatterns: RegExp[] = [
  /\.evil\.com$/,
  /malicious\.org$/,
  /\.suspicious\.net$/,
  /hack\.io$/
];

/**
 * Checks if a given origin is suspicious based on predefined patterns.
 * @param origin - The origin to check
 * @returns True if the origin matches any suspicious pattern, false otherwise
 */
function isSuspiciousOrigin(origin: string): boolean {
  return suspiciousPatterns.some(pattern => pattern.test(origin));
}

/**
 * Middleware function to check and handle request origins.
 * It logs the origin of incoming requests and blocks suspicious origins.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export function originMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const origin = req.get('origin');

  if (origin) {
    if (isSuspiciousOrigin(origin)) {
      // Log and block suspicious origins
      logger.warn(`Blocked request from suspicious origin: ${origin}`);
      res.status(403).json({ error: 'Access denied due to suspicious origin' });
    } else {
      // Log allowed origins
      logger.info(`Request from origin: ${origin}`);
      next();
    }
  } else {
    // Log requests with no origin
    logger.info('Request with no origin');
    next();
  }
}