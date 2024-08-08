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
  const data: any = {
    model: providerConfig.provider.models[model],
    messages: request.messages,
    stream
  };

  // Copy optional fields if they exist
  const optionalFields = [
    'temperature', 'top_p', 'n', 'stop', 'max_tokens',
    'presence_penalty', 'frequency_penalty', 'logit_bias', 'user'
  ];
  optionalFields.forEach(field => {
    if (request[field as keyof ChatCompletionRequest] !== undefined) {
      data[field] = request[field as keyof ChatCompletionRequest];
    }
  });

  // Handle functions and tools
  if (request.functions) {
    data.functions = request.functions;
    if (request.function_call) {
      data.function_call = request.function_call;
    }
  } else if (request.tools) {
    data.tools = request.tools;
    if (request.tool_choice) {
      data.tool_choice = request.tool_choice;
    }
  }

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