import { Response } from 'express';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import logger from '../../utils/logger';
import { createErrorResponse } from '../../utils/errorHandling';
import { handleStreamingResponse } from './streamProcessor';
import { handleNonStreamingResponse } from './handleNonStreamingResponse';

/**
 * Processes the response from the LLM API.
 * @param res - Express response object
 * @param config - Axios request configuration
 * @param model - The model being used
 * @param stream - Whether the response should be streamed
 */
export async function processResponse(
  res: Response, 
  config: AxiosRequestConfig, 
  model: string, 
  stream?: boolean
): Promise<void> {
  try {
    const response: AxiosResponse = await axios(config);
    if (stream) {
      await handleStreamingResponse(res, response, model);
    } else {
      await handleNonStreamingResponse(res, response);
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      logger.error('LLM API error:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      logger.error('Unexpected error during API call:', error);
      throw createErrorResponse(500, 'Unexpected error during API call');
    }
  }
}