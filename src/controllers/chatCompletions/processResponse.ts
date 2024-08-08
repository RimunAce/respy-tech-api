// Third-party imports
import { Response } from 'express';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import axios from 'axios';

// Local imports
import logger from '../../utils/logger';
import { createErrorResponse } from '../../utils/errorHandling';
import { handleStreamingResponse } from './streamProcessor';
import { handleNonStreamingResponse } from './handleNonStreamingResponse';
import { safeStringify } from '../../utils/safeStringy';

/**
 * Processes the response from an API call.
 * 
 * This function makes an API request using the provided Axios configuration,
 * then handles the response based on whether it is a streaming response or not.
 * If an error occurs during the request, it is handled appropriately.
 * 
 * @param res - Express response object
 * @param config - Axios request configuration
 * @param model - The model being used
 * @param stream - Optional flag indicating if the response should be streamed
 */
export async function processResponse(
  res: Response, 
  config: AxiosRequestConfig, 
  model: string, 
  stream?: boolean
): Promise<void> {
  try {
    // Make the API request using Axios
    const response: AxiosResponse = await axios(config);
    // Handle the response based on the streaming flag
    await handleResponse(res, response, model, stream);
  } catch (error: unknown) {
    // Handle any errors that occur during the request
    handleError(res, error);
  }
}

/**
 * Handles the API response.
 * 
 * This function determines whether the response should be processed as a streaming
 * response or a non-streaming response and calls the appropriate handler.
 * 
 * @param res - Express response object
 * @param response - Axios response object
 * @param model - The model being used
 * @param stream - Optional flag indicating if the response should be streamed
 */
async function handleResponse(res: Response, response: AxiosResponse, model: string, stream?: boolean): Promise<void> {
  if (stream) {
    // Handle streaming response
    await handleStreamingResponse(res, response, model);
  } else {
    // Handle non-streaming response
    await handleNonStreamingResponse(res, response);
  }
}

/**
 * Handles errors that occur during the API request.
 * 
 * This function checks if the error is an Axios error and handles it accordingly.
 * If the error is not an Axios error, it is treated as an unexpected error.
 * 
 * @param res - Express response object
 * @param error - The error that occurred
 */
function handleError(res: Response, error: unknown): void {
  if (res.headersSent) {
    logger.warn('Attempted to send error response, but headers were already sent.');
    return;
  }

  if (axios.isAxiosError(error)) {
    handleAxiosError(res, error as AxiosError);
  } else {
    handleUnexpectedError(res, error);
  }
}

/**
 * Handles Axios-specific errors.
 * 
 * This function logs the error details and sends an error response to the client.
 * 
 * @param res - Express response object
 * @param error - Axios error object
 */
function handleAxiosError(res: Response, error: AxiosError): void {
  logAxiosError(error);
  sendErrorResponse(res, error);
}

/**
 * Logs Axios error details safely.
 * 
 * This function uses safeStringify to avoid issues with circular references
 * when logging error details.
 * 
 * @param error - Axios error object
 */
function logAxiosError(error: AxiosError): void {
  logger.error('LLM API error:', {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: safeStringify(error.response?.data),
    config: {
      url: error.config?.url,
      method: error.config?.method,
      data: safeStringify(error.config?.data)
    }
  });
}

/**
 * Sends an error response to the client.
 * 
 * This function constructs an error response object and sends it to the client
 * with the appropriate HTTP status code.
 * 
 * @param res - Express response object
 * @param error - Axios error object
 */
function sendErrorResponse(res: Response, error: AxiosError): void {
  const errorResponse = {
    error: 'LLM API error',
    message: error.message,
    details: safeStringify(error.response?.data),
    status: error.response?.status || 500,
  };
  res.status(errorResponse.status).json(errorResponse);
}

/**
 * Handles unexpected errors.
 * 
 * This function logs unexpected errors and sends a generic error response to the client.
 * 
 * @param res - Express response object
 * @param error - The unexpected error that occurred
 */
function handleUnexpectedError(res: Response, error: unknown): void {
  logger.error('Unexpected error during API call:', error instanceof Error ? error.message : String(error));
  res.status(500).json(createErrorResponse(500, 'Unexpected error during API call'));
}
