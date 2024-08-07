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
  const errors = [
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

  return errors;
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
 * Validates the messages array in a ChatCompletionRequest.
 * Checks for correct structure, valid roles, and proper content types.
 * @param messages - The messages array to validate.
 * @returns An array of error messages. An empty array indicates no errors.
 */
function validateMessages(messages: ChatCompletionRequest['messages']): string[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return ['Messages must be a non-empty array'];
  }

  const errors: string[] = [];

  messages.forEach((message, index) => {
    if (typeof message.role !== 'string' || !['system', 'user', 'assistant'].includes(message.role)) {
      errors.push(`Invalid role for message at index ${index}`);
    }

    if (Array.isArray(message.content)) {
      message.content.forEach((content, contentIndex) => {
        if (content.type !== 'text' && content.type !== 'image_url') {
          errors.push(`Invalid content type at message ${index}, content ${contentIndex}`);
        }
        if (content.type === 'text' && typeof content.text !== 'string') {
          errors.push(`Invalid text content at message ${index}, content ${contentIndex}`);
        }
        if (content.type === 'image_url' && typeof content.image_url?.url !== 'string') {
          errors.push(`Invalid image_url content at message ${index}, content ${contentIndex}`);
        }
      });
    } else if (typeof message.content !== 'string') {
      errors.push(`Invalid content for message at index ${index}`);
    }
  });

  return errors;
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