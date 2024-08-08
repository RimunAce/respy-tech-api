/* eslint-disable @typescript-eslint/no-explicit-any */
// Local imports
import { ChatCompletionRequest, ProviderConfig } from '../../../types/openai';

// Third-party imports
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
  const data = {
    model: providerConfig.provider.models[model],
    messages: request.messages,
    stream,
    ...Object.fromEntries(
      ['temperature', 'top_p', 'n', 'stop', 'max_tokens', 'presence_penalty', 'frequency_penalty', 'logit_bias', 'user']
        .filter(field => request[field as keyof ChatCompletionRequest] !== undefined)
        .map(field => [field, request[field as keyof ChatCompletionRequest]])
    ),
    ...(request.functions ? { functions: request.functions, function_call: request.function_call } : {}),
    ...(request.tools ? { tools: request.tools, tool_choice: request.tool_choice } : {})
  };

  return {
    method: 'post',
    url: providerConfig.provider.endpoint,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${providerConfig.apiKey}`
    },
    data,
    responseType: stream ? 'stream' : 'json'
  };
}