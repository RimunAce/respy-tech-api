// Local imports
import { ChatCompletionRequest } from '../types/openai';
import { isValidModel } from './validationUtils';

// Third-party 
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes a string input by removing HTML tags, potential script injections, and trimming whitespace.
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  // Use sanitize-html to clean the input
  const sanitized = sanitizeHtml(input, {
    allowedTags: [], // Don't allow any HTML tags
    allowedAttributes: {}, // Don't allow any attributes
    disallowedTagsMode: 'discard', // Discard any HTML tags encountered
    textFilter: (text) => {
      // Remove any potential script injections
      return text.replace(/(javascript|script):/gi, '');
    }
  });

  // Trim whitespace
  return sanitized.trim();
}

/**
 * Sanitizes a ChatCompletionRequest object by cleaning all its properties.
 * @param request - The ChatCompletionRequest object to sanitize
 * @returns A new sanitized ChatCompletionRequest object
 */
export function sanitizeChatCompletionRequest(request: ChatCompletionRequest): ChatCompletionRequest {
  return {
    ...request,
    model: sanitizeModel(request.model),
    messages: sanitizeMessages(request.messages),
    functions: sanitizeFunctions(request.functions),
    function_call: sanitizeFunctionCall(request.function_call),
    user: request.user ? sanitizeInput(request.user) : undefined,
    ...sanitizeNumericParams(request),
  };
}

/**
 * Sanitizes the model string.
 * @param model - The model string to sanitize
 * @returns The sanitized model string or an empty string if invalid
 */
function sanitizeModel(model: string): string {
  return isValidModel(model) ? model : '';
}

/**
 * Sanitizes an array of message objects.
 * @param messages - The array of message objects to sanitize
 * @returns A new array of sanitized message objects
 */
function sanitizeMessages(messages: ChatCompletionRequest['messages']): ChatCompletionRequest['messages'] {
  return messages.map(message => ({
    ...message,
    role: sanitizeInput(message.role),
    content: sanitizeInput(message.content)
  }));
}

/**
 * Sanitizes an array of function objects.
 * @param functions - The array of function objects to sanitize
 * @returns A new array of sanitized function objects, or undefined if input is undefined
 */
function sanitizeFunctions(functions?: ChatCompletionRequest['functions']): ChatCompletionRequest['functions'] {
  return functions?.map(func => ({
    ...func,
    name: sanitizeInput(func.name),
    description: sanitizeInput(func.description),
    parameters: JSON.parse(sanitizeInput(JSON.stringify(func.parameters)))
  }));
}

/**
 * Sanitizes the function_call property of a ChatCompletionRequest.
 * @param functionCall - The function_call property to sanitize
 * @returns The sanitized function_call value, or undefined if invalid
 */
function sanitizeFunctionCall(functionCall: ChatCompletionRequest['function_call']): ChatCompletionRequest['function_call'] {
  if (!functionCall) return undefined;
  if (typeof functionCall === 'string') {
    return functionCall === 'auto' || functionCall === 'none' ? functionCall : undefined;
  }
  return typeof functionCall === 'object' && 'name' in functionCall ? 
    { name: sanitizeInput(functionCall.name) } : undefined;
}

/**
 * Sanitizes numeric parameters of a ChatCompletionRequest.
 * @param request - The ChatCompletionRequest object containing numeric parameters
 * @returns An object with sanitized numeric parameters
 */
function sanitizeNumericParams(request: ChatCompletionRequest): Partial<ChatCompletionRequest> {
  return {
    temperature: sanitizeRange(request.temperature, 0, 2),
    top_p: sanitizeRange(request.top_p, 0, 1),
    n: sanitizeInteger(request.n, 1),
    stream: typeof request.stream === 'boolean' ? request.stream : undefined,
    max_tokens: sanitizeInteger(request.max_tokens, 1),
    presence_penalty: sanitizeRange(request.presence_penalty, -2, 2),
    frequency_penalty: sanitizeRange(request.frequency_penalty, -2, 2),
  };
}

/**
 * Sanitizes a numeric value to ensure it's within a specified range.
 * @param value - The numeric value to sanitize
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The sanitized value within the specified range, or undefined if input is invalid
 */
function sanitizeRange(value: number | undefined, min: number, max: number): number | undefined {
  return typeof value === 'number' ? Math.max(min, Math.min(max, value)) : undefined;
}

/**
 * Sanitizes an integer value to ensure it's at least a specified minimum.
 * @param value - The integer value to sanitize
 * @param min - The minimum allowed value
 * @returns The sanitized integer value, or undefined if input is invalid
 */
function sanitizeInteger(value: number | undefined, min: number): number | undefined {
  return typeof value === 'number' ? Math.max(min, Math.floor(value)) : undefined;
}