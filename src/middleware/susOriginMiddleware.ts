import express from 'express';
import logger from '../utils/logger';

const suspiciousPatterns = [
  /\.evil\.com$/,
  /malicious\.org$/,
  /\.suspicious\.net$/,
  /hack\.io$/
];

export function originMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.get('origin');
  if (origin) {
    if (suspiciousPatterns.some(pattern => pattern.test(origin))) {
      logger.warn(`Blocked request from suspicious origin: ${origin}`);
      return res.status(403).json({ error: 'Access denied due to suspicious origin' });
    }
    logger.info(`Request from origin: ${origin}`);
  } else {
    logger.info('Request with no origin');
  }
  next();
}