/* eslint-disable @typescript-eslint/no-explicit-any */
// Third-party imports
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Response } from 'express';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

// Local imports
import { getProviderForModel, modelSupportsImages } from '../utils/providerUtils';
import logger, { logRequest, logResponse } from '../utils/logger';
import { validateChatCompletionRequest } from '../utils/validationUtils';
import { sanitizeChatCompletionRequest } from '../utils/sanitizationUtils';
import { ChatCompletionRequest, ProviderConfig, ModelConfig } from '../types/openai';
import { Request as CustomRequest } from '../types/openai';

// Define interfaces for type safety
interface StreamData {
  id?: string;
  choices?: Array<{
    delta?: {
      content?: string;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason?: string | null;
  }>;
}

interface FormattedStreamData {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    finish_reason: string | null;
  }>;
}

interface ErrorResponse {
  error: string;
  statusCode: number;
}

/**
 * Creates an error response object with a status code and message.
 * @param statusCode - HTTP status code for the error
 * @param message - Error message
 * @returns An object with error message and status code
 */
const createErrorResponse = (statusCode: number, message: string): ErrorResponse => ({ error: message, statusCode });

/**
 * Creates an optimized configuration for the API request.
 * @param providerConfig - Configuration for the provider
 * @param chatCompletionRequest - The chat completion request
 * @param stream - Whether the response should be streamed
 * @param model - The model being used
 * @returns AxiosRequestConfig object
 */
const createOptimizedConfig = (
  providerConfig: ProviderConfig,
  chatCompletionRequest: ChatCompletionRequest,
  stream: boolean,
  model: string
): AxiosRequestConfig => ({
  method: 'post',
  url: providerConfig.provider.endpoint,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${providerConfig.apiKey}`,
  },
  data: {
    ...chatCompletionRequest,
    model: providerConfig.provider.models[model], // Use the model mapping from provider config
    functions: chatCompletionRequest.functions,
    function_call: chatCompletionRequest.function_call,
  },
  responseType: stream ? 'stream' : 'json',
});

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
      handleError(res, error);
    } else {
      logger.error('Unknown error in chat completion process');
      handleError(res, new Error('Unknown error occurred'));
    }
  } finally {
    logPerformance(startTime);
  }
}

/**
 * Validates and processes the chat completion request.
 * @param req - Express request object
 * @param sanitizedBody - Sanitized chat completion request
 * @param req - Express request object
 * @param res - Express response object
 */
async function validateAndProcessRequest(sanitizedBody: ChatCompletionRequest, req: CustomRequest, res: Response): Promise<void> {
  // Sanitized body is already passed as a parameter, no need to sanitize again
  validateRequest(sanitizedBody);

  // Additional processing steps will follow...
  const modelInfo = await getModelInfo(sanitizedBody.model);
  
  checkPremiumAccess(modelInfo, req.apiKeyInfo);

  const supportsImages = await modelSupportsImages(sanitizedBody.model);
  if (!supportsImages && sanitizedBody.messages.some(msg => Array.isArray(msg.content))) {
    throw new Error('Unsupported content type');
  }
  
  const providerConfig = await getProviderAndApiKey(sanitizedBody);
  const config = createOptimizedConfig(providerConfig, sanitizedBody, sanitizedBody.stream ?? false, sanitizedBody.model);
  
  logger.info(`Using provider: ${providerConfig.provider.name}, model: ${providerConfig.provider.models[sanitizedBody.model]}`);
  await processResponse(res, config, sanitizedBody.model, sanitizedBody.stream);
}

/**
 * Validates the chat completion request.
 * @param body - The request body
 * @throws {ErrorResponse} If the request is invalid
 */
function validateRequest(body: ChatCompletionRequest): void {
  const validationErrors = validateChatCompletionRequest(body);
  if (validationErrors.length > 0) {
    throw createErrorResponse(400, `Invalid request: ${validationErrors.join(', ')}`);
  }
}

/**
 * Retrieves model information from the configuration.
 * @param requestedModel - The requested model ID
 * @returns {Promise<any>} The model information
 * @throws {ErrorResponse} If the model is not supported
 */
async function getModelInfo(requestedModel: string): Promise<any> {
  const modelConfig = await readModelConfig();
  const modelInfo = modelConfig.models.find(model => model.id === requestedModel);
  if (!modelInfo) {
    throw createErrorResponse(400, `Unsupported model: ${requestedModel}`);
  }
  return modelInfo;
}

/**
 * Checks if the user has premium access for premium models.
 * @param modelInfo - The model information
 * @param apiKeyInfo - The API key information
 * @throws {ErrorResponse} If premium access is required but not available
 */
function checkPremiumAccess(modelInfo: any, apiKeyInfo: any): void {
  if (modelInfo.premium && !apiKeyInfo?.premium) {
    throw createErrorResponse(403, 'This model requires a premium API key');
  }
}

/**
 * Handles function calls from the LLM.
 * @param functionCall - The function call object
 * @param res - The Express response object
 */
async function handleFunctionCall(functionCall: { name: string; arguments: string }, res: Response): Promise<void> {
  logger.info(`Function called: ${functionCall.name} with arguments: ${functionCall.arguments}`);

  // Placeholder implementation - replace with actual function execution logic
  const result = { result: `Executed ${functionCall.name} with ${functionCall.arguments}` };

  // Send the function result back to the client
  res.write(`data: ${JSON.stringify({ function_call: functionCall, result })}\n\n`);
}

/**
 * Reads the model configuration from a JSON file.
 * @returns A promise that resolves to the model configuration
 */
async function readModelConfig(): Promise<ModelConfig> {
  const modelsData = await fs.readFile(path.join(__dirname, '../../models/config.json'), 'utf-8');
  return JSON.parse(modelsData);
}

/**
 * Retrieves the provider configuration and API key for a given chat completion request.
 * @param chatCompletionRequest - The chat completion request
 * @returns A promise that resolves to the provider configuration
 * @throws An error if the model is unsupported or the API key is not found
 */
async function getProviderAndApiKey(chatCompletionRequest: ChatCompletionRequest): Promise<ProviderConfig> {
  const modelId = chatCompletionRequest.model;
  const provider = await getProviderForModel(modelId);

  if (!provider) {
    logger.error(`Provider not found for model: ${modelId}`);
    throw createErrorResponse(400, `Unsupported model: ${modelId}`);
  }

  // Access environment variables safely
  const apiKey = process.env[`${provider.name.toLowerCase()}`]; // Use a more descriptive variable name

  if (!apiKey) {
    logger.error(`API key not found for provider: ${provider.name}`);
    throw createErrorResponse(500, `API key not found for the provider: ${provider.name}`);
  }

  return { provider, apiKey };
}

/**
 * Processes the response from the LLM API.
 * @param res - Express response object
 * @param config - Axios request configuration
 * @param model - The model being used
 * @param stream - Whether the response should be streamed
 */
async function processResponse(res: Response, config: AxiosRequestConfig, model: string, stream?: boolean): Promise<void> {
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

/**
 * Handles errors that occur during the chat completion process.
 * @param res - Express response object
 * @param error - The error that occurred
 */
function handleError(res: Response, error: unknown): void {
  logger.error('Error in chat completion process:', error);
  const errorResponse: ErrorResponse = error instanceof Error && 'statusCode' in error && 'error' in error
    ? error as ErrorResponse
    : createErrorResponse(500, 'Internal server error');

  if (!res.headersSent) {
    logResponse({
      statusCode: errorResponse.statusCode,
      statusMessage: 'Error',
      body: errorResponse
    });
    res.status(errorResponse.statusCode).json(errorResponse);
  }
}

/**
 * Logs the performance metrics of the request.
 * @param startTime - The start time of the request
 */
function logPerformance(startTime: number): void {
  const timeTaken = performance.now() - startTime;
  logger.info(`[PERFORMANCE] Response time: ${(timeTaken / 1000).toFixed(2)} seconds`);
}

/**
 * Handles streaming responses from the LLM API.
 * @param res - Express response object
 * @param response - Axios response object
 * @param model - The model being used
 */
async function handleStreamingResponse(res: Response, response: AxiosResponse, model: string): Promise<void> {
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

/**
 * Handles non-streaming responses from the LLM API.
 * @param res - Express response object
 * @param response - Axios response object
 */
async function handleNonStreamingResponse(res: Response, response: AxiosResponse): Promise<void> {
  const responseData = response.data;
  logger.info('AI Response:', JSON.stringify(responseData, null, 2));

  // Handle function calls
  if (responseData.choices && responseData.choices[0]?.function_call) { // Added null check for choices[0]
    await handleFunctionCall(responseData.choices[0].function_call, res);
  } else {
    res.json(responseData);
  }

  logResponse({
    statusCode: response.status,
    statusMessage: response.statusText,
    headers: response.headers,
    body: responseData
  });
}

/**
 * Processes streaming data from the LLM API.
 */
class StreamProcessor {
  private buffer: string = '';
  private readonly res: Response;
  private readonly model: string;
  private isStreamDestroyed: boolean = false;

  constructor(res: Response, model: string) {
    this.res = res;
    this.model = model;
    
    // Add event listener for client disconnect
    this.res.on('close', () => {
      this.isStreamDestroyed = true;
      logger.info('Client disconnected, stream destroyed');
    });
  }

  /**
   * Processes a chunk of data from the stream.
   * @param chunk - A buffer containing a chunk of data
   */
  async processChunk(chunk: Buffer): Promise<void> {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      await this.processLine(line.trim());
    }
  }

  /**
   * Processes a single line of data from the stream.
   * @param line - A line of data from the stream
   */
  private async processLine(line: string): Promise<void> {
    if (line === 'data: [DONE]') {
      await this.writeToResponse('data: [DONE]\n\n');
    } else if (line.startsWith('data:')) {
      await this.processDataLine(line);
    }
  }

  /**
   * Processes a data line from the stream.
   * @param line - The data line to process
   */
  private async processDataLine(line: string): Promise<void> {
    if (this.isStreamDestroyed) {
      logger.debug('Stream is destroyed, skipping data processing');
      return;
    }

    try {
      const data: StreamData = JSON.parse(line.slice(5));
      const formattedData = this.formatStreamData(data);
      await this.handleFormattedData(formattedData);
    } catch (error) {
      if (!this.isStreamDestroyed) {
        logger.error('Error parsing stream data:', error);
      }
    }
  }

  /**
   * Handles the formatted stream data.
   * @param formattedData - The formatted data
   */
  private async handleFormattedData(formattedData: FormattedStreamData): Promise<void> {
    if (formattedData.choices[0]?.delta?.function_call) { // Added null check for choices[0]
      const functionCall = formattedData.choices[0].delta.function_call;
      await this.writeToResponse(`data: ${JSON.stringify(formattedData)}\n\n`);
      if (functionCall.name && functionCall.arguments) {
        await handleFunctionCall({ name: functionCall.name, arguments: functionCall.arguments }, this.res);
      }
    } else {
      await this.writeToResponse(`data: ${JSON.stringify(formattedData)}\n\n`);
      this.logContent(formattedData);
    }
  }

  /**
   * Logs the content of the stream data.
   * @param formattedData - The formatted data
   */
  private logContent(formattedData: FormattedStreamData): void {
    const content = formattedData.choices[0]?.delta?.content; // Added null check for choices[0]
    if (content) {
      logger.info('AI Response (Stream):', content);
    }
  }

  /**
   * Formats the stream data to match the expected output format.
   * @param data - The data to format
   * @returns Formatted stream data
   */
  private formatStreamData(data: StreamData): FormattedStreamData {
    return {
      id: data.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: this.model,
      choices: [this.formatChoice(data.choices?.[0])] // Use optional chaining
    };
  }

  /**
   * Formats a single choice from the stream data.
   * @param choice - The choice to format
   * @returns Formatted choice data
   */
  private formatChoice(
    choice: { delta?: { content?: string; function_call?: { name?: string; arguments?: string } }; finish_reason?: string | null } = {} // Provide default value
  ): { index: number; delta: { content?: string; function_call?: { name: string; arguments: string } }; finish_reason: string | null } {
    return {
      index: 0,
      delta: {
        content: choice.delta?.content,
        function_call: choice.delta?.function_call && choice.delta.function_call.name && choice.delta.function_call.arguments
          ? { name: choice.delta.function_call.name, arguments: choice.delta.function_call.arguments }
          : undefined,
      },
      finish_reason: choice.finish_reason || null
    };
  }

  /**
   * Writes data to the response stream.
   * @param data - The data to write
   * @returns A promise that resolves when the write is complete
   */
  private writeToResponse(data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isStreamDestroyed) {
        logger.debug('Stream is destroyed, skipping write');
        resolve();
        return;
      }

      this.res.write(data, 'utf8', (error) => {
        if (error) {
          if (!this.isStreamDestroyed) {
            reject(error);
          } else {
            resolve(); // Resolve silently if the stream is already destroyed
          }
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Ends the stream processing, handling any remaining data in the buffer.
   */
  async end(): Promise<void> {
    if (this.isStreamDestroyed) {
      logger.debug('Stream is already destroyed, skipping end process');
      return;
    }

    if (this.buffer.trim()) {
      logger.debug('Processing remaining buffer:', this.buffer);
      const lines = this.buffer.split('\n');
      for (const line of lines) {
        await this.processLine(line.trim());
      }
    }
    await this.writeToResponse('data: [DONE]\n\n');
    this.res.end();
    this.isStreamDestroyed = true;
    logger.info('Stream ended');
  }
}