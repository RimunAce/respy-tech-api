// Local imports
import { chatCompletionSchema, ChatCompletionRequest } from '../schema/chatCompletionsSchema';

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
export function sanitizeChatCompletionRequest(input: unknown): ChatCompletionRequest {
  const parsed = chatCompletionSchema.parse(input);
  return {
    ...parsed,
    messages: sanitizeMessages(parsed.messages) as ChatCompletionRequest['messages'],
    functions: sanitizeFunctions(parsed.functions) as ChatCompletionRequest['functions'],
    tools: sanitizeTools(parsed.tools) as ChatCompletionRequest['tools'],
    user: parsed.user ? sanitizeInput(parsed.user) : undefined
  };
}

function sanitizeMessages(messages: unknown[]): unknown[] {
  return messages.map(msg => {
    const typedMsg = msg as Record<string, unknown>;
    return {
      ...typedMsg,
      content: typeof typedMsg.content === 'string' ? sanitizeInput(typedMsg.content) : typedMsg.content,
      name: typedMsg.name && typeof typedMsg.name === 'string' ? sanitizeInput(typedMsg.name) : undefined,
      function_call: typedMsg.function_call ? sanitizeFunctionCall(typedMsg.function_call) : undefined
    };
  });
}

function sanitizeFunctionCall(functionCall: unknown): unknown {
  const typedFunctionCall = functionCall as Record<string, unknown>;
  return {
    name: typeof typedFunctionCall.name === 'string' ? sanitizeInput(typedFunctionCall.name) : typedFunctionCall.name,
    arguments: typeof typedFunctionCall.arguments === 'string' ? sanitizeInput(typedFunctionCall.arguments) : typedFunctionCall.arguments
  };
}

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