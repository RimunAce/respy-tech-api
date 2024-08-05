// Third-party imports
import { CorsOptions } from 'cors';
import dotenv from 'dotenv';

// Local imports
import logger from '../utils/logger';

dotenv.config();

// Parse allowed origins from environment variable or use an empty array if not set
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
// Check if all origins are allowed
const allowAllOrigins = process.env.ALLOWED_ORIGINS === '*';

/**
 * Checks if the given origin is allowed based on the CORS configuration.
 * @param origin - The origin to check, can be undefined for same-origin requests.
 * @returns {boolean} True if the origin is allowed, false otherwise.
 */
function isOriginAllowed(origin: string | undefined): boolean {
  return allowAllOrigins || !origin || allowedOrigins.includes(origin);
}

/**
 * CORS configuration options for the application.
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow credentials to be sent with requests
  maxAge: 86400, // Cache CORS preflight request results for 24 hours (in seconds)
};