import { Response } from 'express';
import logger from './logger';

export interface ErrorResponse {
  error: string;
  statusCode: number;
}

/**
 * Creates an error response object with a status code and message.
 * @param statusCode - HTTP status code for the error
 * @param message - Error message
 * @returns An object with error message and status code
 */
export const createErrorResponse = (statusCode: number, message: string): ErrorResponse => ({ 
  error: message, 
  statusCode 
});

/**
 * Handles errors that occur during the chat completion process.
 * @param res - Express response object
 * @param error - The error that occurred
 */
export function handleError(res: Response, error: unknown): void {
  // Log the error without stringifying it
  logger.error('Error in chat completion process:', error instanceof Error ? error.message : String(error));

  // Create a safe error response
  const errorResponse: ErrorResponse = error instanceof Error
    ? createErrorResponse(500, error.message)
    : createErrorResponse(500, 'Internal server error');

  if (!res.headersSent) {
    res.status(errorResponse.statusCode).json({
      error: errorResponse.error,
      statusCode: errorResponse.statusCode
    });
  }
}