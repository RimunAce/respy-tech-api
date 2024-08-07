import { ApiKey } from '../../../types/openai';

interface ModelInfo {
  premium: boolean;
}

/**
 * Checks if the user has premium access for the requested model.
 * @param modelInfo - Information about the requested model
 * @param apiKeyInfo - Information about the user's API key
 * @throws Error if premium access is required but not available
 */
export function checkPremiumAccess(modelInfo: ModelInfo, apiKeyInfo?: ApiKey): void {
  // Check if the model requires premium access and if the API key information is provided
  const isPremiumModel = modelInfo.premium;
  const hasValidApiKey = apiKeyInfo && apiKeyInfo.premium;

  // If the model is premium and the user does not have a valid API key, throw an error
  if (isPremiumModel && !hasValidApiKey) {
    throw new Error('Premium access required for this model');
  }
}