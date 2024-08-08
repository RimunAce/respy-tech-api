// Third-party imports
import { Response } from 'express';
import { AxiosResponse } from 'axios';

// Local imports
import logger from '../../utils/logger';

/**
 * Handles non-streaming responses from the LLM API.
 * @param res - Express response object
 * @param response - Axios response object
 */
export async function handleNonStreamingResponse(
  res: Response,
  response: AxiosResponse
): Promise<void> {
  const data = response.data;
  
  // Handle function calls
  const firstChoice = data.choices?.[0];
  const message = firstChoice?.message;
  if (message?.function_call) {
    message.content = null; // Set content to null for function calls
  }

  logger.info('Non-streaming AI Response:', data);
  
  // Ensure the response hasn't been sent yet
  if (!res.headersSent) {
    res.json(data);
  } else {
    logger.warn('Attempted to send non-streaming response, but headers were already sent.');
  }
}