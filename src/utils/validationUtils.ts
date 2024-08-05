/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatCompletionRequest } from '../types/openai';

/**
 * Checks if the provided model is valid.
 * @param model - The model to validate.
 * @returns True if the model is a non-empty string, false otherwise.
 */
export const isValidModel = (model: any): boolean => typeof model === 'string' && model.length > 0;

/**
 * Validates a ChatCompletionRequest object.
 * @param request - The ChatCompletionRequest object to validate.
 * @returns An array of error messages. An empty array indicates no errors.
 */
export function validateChatCompletionRequest(request: ChatCompletionRequest): string[] {
  return [
    ...validateModel(request.model),
    ...validateMessages(request.messages),
    ...validateNumberParam(request.temperature, 'Temperature', 0, 2),
    ...validateNumberParam(request.top_p, 'Top_p', 0, 1),
    ...validateIntegerParam(request.n, 'N', 1),
    ...validateBooleanParam(request.stream, 'Stream'),
    ...validateIntegerParam(request.max_tokens, 'Max_tokens', 1),
    ...validateNumberParam(request.presence_penalty, 'Presence_penalty', -2, 2),
    ...validateNumberParam(request.frequency_penalty, 'Frequency_penalty', -2, 2),
  ].filter(Boolean);
}

/**
 * Validates the model parameter.
 * @param model - The model to validate.
 * @returns An array with an error message if invalid, or an empty array if valid.
 */
function validateModel(model: any): string[] {
  return isValidModel(model) ? [] : ['Invalid or missing model'];
}

/**
 * Validates the messages array.
 * @param messages - The messages array to validate.
 * @returns An array of error messages. An empty array indicates no errors.
 */
function validateMessages(messages: any): string[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return ['Invalid or missing messages'];
  }
  return messages.flatMap((message, index) =>
    typeof message.role !== 'string' || typeof message.content !== 'string'
      ? [`Invalid message format at index ${index}`]
      : []
  );
}

/**
 * Validates a number parameter within a specified range.
 * @param value - The value to validate.
 * @param name - The name of the parameter (for error messages).
 * @param min - The minimum allowed value.
 * @param max - The maximum allowed value.
 * @returns An array with an error message if invalid, or an empty array if valid.
 */
function validateNumberParam(value: any, name: string, min: number, max: number): string[] {
  return value !== undefined && (typeof value !== 'number' || value < min || value > max)
    ? [`${name} must be a number between ${min} and ${max}`]
    : [];
}

/**
 * Validates an integer parameter with a minimum value.
 * @param value - The value to validate.
 * @param name - The name of the parameter (for error messages).
 * @param min - The minimum allowed value.
 * @returns An array with an error message if invalid, or an empty array if valid.
 */
function validateIntegerParam(value: any, name: string, min: number): string[] {
  return value !== undefined && (typeof value !== 'number' || !Number.isInteger(value) || value < min)
    ? [`${name} must be a positive integer${min > 1 ? ` greater than or equal to ${min}` : ''}`]
    : [];
}

/**
 * Validates a boolean parameter.
 * @param value - The value to validate.
 * @param name - The name of the parameter (for error messages).
 * @returns An array with an error message if invalid, or an empty array if valid.
 */
function validateBooleanParam(value: any, name: string): string[] {
  return value !== undefined && typeof value !== 'boolean'
    ? [`${name} must be a boolean`]
    : [];
}