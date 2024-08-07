import { Response } from 'express';
import { AxiosResponse } from 'axios';
import logger from '../../utils/logger';
import { StreamProcessor } from './utils/streamUtils';

/**
 * Handles streaming responses from the LLM API.
 * @param res - Express response object
 * @param response - Axios response object
 * @param model - The model being used
 */
export async function handleStreamingResponse(
  res: Response, 
  response: AxiosResponse, 
  model: string
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const streamProcessor = new StreamProcessor(res, model);
  let fullResponse = '';

  try {
    for await (const chunk of response.data) {
      await streamProcessor.processChunk(chunk);
      fullResponse += chunk.toString();
    }
  } catch (error) {
    logger.error('Error processing stream:', error);
    if (!res.writableEnded) {
      res.write(`data: [ERROR] Stream processing failed\n\n`);
      res.end();
    }
  } finally {
    await streamProcessor.end();
    logger.info('Full AI Response:', fullResponse);
  }
}