// Local imports
import { chatCompletionSchema } from '../schema/chatCompletionsSchema';

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

export function sanitizeChatCompletionRequest(input: unknown) {
  return chatCompletionSchema.parse(input);
}