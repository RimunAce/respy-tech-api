// Third-party imports
import { Response } from 'express';
import { performance } from 'perf_hooks';

// Local imports
import { Request as CustomRequest } from '../../types/openai';
import logger, { logRequest } from '../../utils/logger';
import { sanitizeChatCompletionRequest } from '../../utils/sanitizationUtils';
import { validateChatCompletionRequest } from '../../utils/validationUtils';
import { createErrorResponse, handleError } from '../../utils/errorHandling';
import { logPerformance } from './utils/performanceLogging';
import { validateAndProcessRequest } from './validateAndProcessRequest';

/**
 * Handles chat completion requests.
 * @param req - Express request object
 * @param res - Express response object
 */
export async function handleChatCompletions(req: CustomRequest, res: Response): Promise<void> {
  const startTime = performance.now();
  logRequest(req);

  try {
    const sanitizedBody = sanitizeChatCompletionRequest(req.body);
    const validationErrors = validateChatCompletionRequest(sanitizedBody);

    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors });
      return;
    }

    await validateAndProcessRequest(sanitizedBody, req, res);
  } catch (error: unknown) {
    if (error instanceof Error) {
        logger.error(`Error in chat completion process: ${error.message}`);
        logger.error(error.stack);
        if (error.message === 'This model does not support image inputs') {
        handleError(res, createErrorResponse(400, error.message));
        } else {
        handleError(res, error);
        }
    } else {
        logger.error('Unknown error in chat completion process');
        handleError(res, new Error('Unknown error occurred'));
    }
  } finally {
    logPerformance(startTime);
  }
}