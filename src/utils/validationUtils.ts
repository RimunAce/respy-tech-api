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

/**
 * Validates the consistency between functions/tools and function_call/tool_choice.
 * @param request - The ChatCompletionRequest object to validate.
 * @returns An array of error messages. An empty array indicates no errors.
 */
export function validateFunctionToolConsistency(request: any): string[] {
  const inconsistencies = [
    { condition: request.functions && request.tools, message: "Both 'functions' and 'tools' are present. Use only one of them." },
    { condition: request.function_call && request.tool_choice, message: "Both 'function_call' and 'tool_choice' are present. Use only one of them." },
    { condition: request.functions && request.tool_choice, message: "'functions' is used with 'tool_choice'. Use 'function_call' instead." },
    { condition: request.tools && request.function_call, message: "'tools' is used with 'function_call'. Use 'tool_choice' instead." },
  ];

  return inconsistencies.filter(({ condition }) => condition).map(({ message }) => message);
}