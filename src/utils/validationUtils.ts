/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatCompletionSchema } from '../schema/chatCompletionsSchema';
import { ZodError } from 'zod';

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
export function validateChatCompletionRequest(request: unknown): string[] {
  try {
    chatCompletionSchema.parse(request);
    return [];
  } catch (error) {
    if (error instanceof ZodError) {
      return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    }
    return ['Unknown validation error'];
  }
}