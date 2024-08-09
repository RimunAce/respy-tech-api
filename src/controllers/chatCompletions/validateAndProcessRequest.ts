// Third-party imports
import { Response } from 'express';

// Local imports
import { ChatCompletionRequest } from '../../types/openai';
import { Request as CustomRequest } from '../../types/openai';
import { getModelInfo } from './utils/modelUtils';
import { checkPremiumAccess } from './utils/accessUtils';
import { modelSupportsImages } from './utils/providerUtils';
import { createOptimizedConfig } from './utils/configUtils';
import logger from '../../utils/logger';
import { processResponse } from './processResponse';
import { handleError } from '../../utils/errorHandling';
import { createFailoverFunction } from './utils/failoverUtils';

/**
 * Validates and processes the chat completion request.
 * @param sanitizedBody - Sanitized chat completion request
 * @param req - Express request object
 * @param res - Express response object
 */
export async function validateAndProcessRequest(
  sanitizedBody: ChatCompletionRequest, 
  req: CustomRequest, 
  res: Response
): Promise<void> {
  const modelInfo = await getModelInfo(sanitizedBody.model);
  
  checkPremiumAccess(modelInfo, req.apiKeyInfo);

  const supportsImages = await modelSupportsImages(sanitizedBody.model);
  const hasImageContent = sanitizedBody.messages.some(msg => 
    Array.isArray(msg.content) && msg.content.some(item => item.type === 'image_url')
  );
  if (!supportsImages && hasImageContent) {
    throw new Error('This model does not support image inputs');
  }
  
  const failover = createFailoverFunction(15000); // 15 seconds timeout
  try {
    const providerConfig = await failover(sanitizedBody);
    const config = createOptimizedConfig(providerConfig, sanitizedBody, sanitizedBody.stream ?? false, sanitizedBody.model);
  
    logger.info(`Using provider: ${providerConfig.provider.name}, model: ${providerConfig.provider.models[sanitizedBody.model]}`);
  
    await processResponse({ res, config, model: sanitizedBody.model, stream: sanitizedBody.stream });
  } catch (error) {
    handleError(res, error);
  }
}