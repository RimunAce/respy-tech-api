import fs from 'fs/promises';
import path from 'path';
import { ChatCompletionRequest, ProviderConfig } from '../../../types/openai';
import logger from '../../../utils/logger';

interface Provider {
  name: string;
  endpoint: string;
  models: { [key: string]: string };
}

/**
 * Checks if a model supports image inputs.
 * @param model - The model to check
 * @returns A promise that resolves to a boolean indicating image support
 */
export async function modelSupportsImages(model: string): Promise<boolean> {
  const assumeAllModelsSupport = process.env.ASSUME_ALL_MODELS_SUPPORT_IMAGES === 'true';
  if (assumeAllModelsSupport) {
    return true;
  }
  // Add more vision-capable models to this array as needed
  const visionModels = ['gpt-4-vision-preview', 'gemini-pro-vision', 'gpt-4o-2024-08-06'];
  return visionModels.includes(model);
}

/**
 * Gets the provider configuration and API key for a given request.
 * @param request - The chat completion request
 * @returns A promise that resolves to the ProviderConfig
 */
export async function getProviderAndApiKey(request: ChatCompletionRequest): Promise<ProviderConfig> {
  try {
    const configPath = path.resolve(__dirname, '../../../../providers/chat-completions.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    // Find the provider that supports the requested model
    const provider = config.providers.find((p: Provider) => p.models[request.model]);
    if (!provider) {
      throw new Error(`No provider found for model ${request.model}`);
    }

    // In a real implementation, you would securely retrieve the API key
    // This is a placeholder and should be replaced with secure key management
    const apiKey = process.env[`${provider.name.toLowerCase()}`];
    if (!apiKey) {
      throw new Error(`API key not found for provider ${provider.name}`);
    }

    return { provider, apiKey };
  } catch (error) {
    logger.error('Error getting provider and API key:', error);
    throw new Error('Failed to retrieve provider configuration');
  }
}