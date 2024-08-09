// Third-party imports
import sanitizeHtml from 'sanitize-html';

// Local imports
import { chatCompletionSchema, ChatCompletionRequest } from '../schema/chatCompletionsSchema';

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

  // Trim whitespace and return
  return sanitized.trim();
}

/**
 * Sanitizes a ChatCompletionRequest object by cleaning all its properties.
 * @param input - The unknown input to be parsed and sanitized
 * @returns A new sanitized ChatCompletionRequest object
 */
export function sanitizeChatCompletionRequest(input: unknown): ChatCompletionRequest {
  // Parse the input using the chatCompletionSchema
  const parsed = chatCompletionSchema.parse(input);
  
  // Return a new object with sanitized properties
  return {
    ...parsed,
    messages: sanitizeMessages(parsed.messages) as ChatCompletionRequest['messages'],
    functions: sanitizeFunctions(parsed.functions) as ChatCompletionRequest['functions'],
    tools: sanitizeTools(parsed.tools) as ChatCompletionRequest['tools'],
    user: parsed.user ? sanitizeInput(parsed.user) : undefined
  };
}

/**
 * Sanitizes an array of message objects.
 * @param messages - Array of unknown message objects
 * @returns Array of sanitized message objects
 */
function sanitizeMessages(messages: unknown[]): unknown[] {
  return messages.map(msg => {
    const typedMsg = msg as Record<string, unknown>;
    return {
      ...typedMsg,
      content: typeof typedMsg.content === 'string' ? sanitizeInput(typedMsg.content) : typedMsg.content,
      name: typedMsg.name && typeof typedMsg.name === 'string' ? sanitizeInput(typedMsg.name) : undefined,
      function_call: typedMsg.function_call ? sanitizeFunctionCall(typedMsg.function_call) : null
    };
  });
}

/**
 * Sanitizes a function call object.
 * @param functionCall - The function call object to sanitize
 * @returns Sanitized function call object
 */
function sanitizeFunctionCall(functionCall: unknown): unknown {
  if (functionCall === null) return null;
  const typedFunctionCall = functionCall as Record<string, unknown>;
  return {
    name: typeof typedFunctionCall.name === 'string' ? sanitizeInput(typedFunctionCall.name) : typedFunctionCall.name,
    arguments: typeof typedFunctionCall.arguments === 'string' ? sanitizeInput(typedFunctionCall.arguments) : typedFunctionCall.arguments
  };
}

/**
 * Sanitizes an array of function objects.
 * @param functions - Optional array of function objects
 * @returns Sanitized array of function objects or undefined
 */
function sanitizeFunctions(functions?: unknown[]): unknown[] | undefined {
  return functions?.map(fn => {
    const typedFn = fn as Record<string, unknown>;
    return {
      ...typedFn,
      name: typeof typedFn.name === 'string' ? sanitizeInput(typedFn.name) : typedFn.name,
      description: typedFn.description && typeof typedFn.description === 'string' ? sanitizeInput(typedFn.description) : typedFn.description,
      parameters: typedFn.parameters
    };
  });
}

/**
 * Sanitizes an array of tool objects.
 * @param tools - Optional array of tool objects
 * @returns Sanitized array of tool objects or undefined
 */
function sanitizeTools(tools?: unknown[]): unknown[] | undefined {
  return tools?.map(tool => {
    const typedTool = tool as Record<string, unknown>;
    const typedFunction = (typedTool.function as Record<string, unknown>) || {};
    return {
      ...typedTool,
      function: {
        ...typedFunction,
        name: typeof typedFunction.name === 'string' ? sanitizeInput(typedFunction.name) : typedFunction.name,
        description: typedFunction.description && typeof typedFunction.description === 'string' ? sanitizeInput(typedFunction.description) : typedFunction.description,
        parameters: typedFunction.parameters
      }
    };
  });
}