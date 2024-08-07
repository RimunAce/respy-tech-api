import { ChatCompletionRequest, ProviderConfig } from '../../../types/openai';
import { AxiosRequestConfig } from 'axios';

/**
 * Creates an optimized configuration for the API request.
 * @param providerConfig - Configuration for the provider
 * @param request - The chat completion request
 * @param stream - Whether the response should be streamed
 * @param model - The model being used
 * @returns An AxiosRequestConfig object
 */
export function createOptimizedConfig(
  providerConfig: ProviderConfig,
  request: ChatCompletionRequest,
  stream: boolean,
  model: string
): AxiosRequestConfig {
  return {
    method: 'post',
    url: providerConfig.provider.endpoint,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${providerConfig.apiKey}`
    },
    data: {
      ...request,
      model: providerConfig.provider.models[model],
      stream
    },
    responseType: stream ? 'stream' : 'json'
  };
}