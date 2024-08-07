import { Response } from 'express';
import { AxiosResponse } from 'axios';
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
  logger.info('Non-streaming AI Response:', response.data);
  res.json(response.data);
}