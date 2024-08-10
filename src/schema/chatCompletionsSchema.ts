/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';

/**
 * Schema for message content, which can be either a string or an array of objects
 * containing text or image URLs.
 */
const messageContentSchema = z.union([
  z.string(),
  z.array(
    z.object({
      type: z.enum(['text', 'image_url']),
      text: z.string().optional(),
      image_url: z.object({
        url: z.string().url(),
        detail: z.enum(['auto', 'low', 'high']).default('auto')
      }).optional()
    })
  )
]);

/**
 * Schema for function definitions, including name, optional description,
 * and parameters.
 */
const functionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.any())
});

/**
 * Schema for tools, currently only supporting functions.
 */
const toolSchema = z.object({
  type: z.literal('function'),
  function: functionSchema
});

/**
 * Main schema for chat completion requests.
 * This schema defines the structure and validation rules for incoming requests.
 */
export const chatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant', 'function', 'tool']),
      content: z.union([messageContentSchema, z.null()]),
      name: z.string().optional(),
      function_call: z.union([
        z.object({
          name: z.string(),
          arguments: z.string()
        }),
        z.null()
      ]).optional()
    })
  ).min(1, "At least one message is required"),
  functions: z.array(functionSchema).optional(),
  function_call: z.union([
    z.literal('auto'),
    z.literal('none'),
    z.object({ name: z.string() })
  ]).optional(),
  tools: z.array(toolSchema).optional(),
  tool_choice: z.union([
    z.literal('auto'),
    z.literal('none'),
    z.object({ type: z.literal('function'), function: z.object({ name: z.string() }) })
  ]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  n: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
  max_tokens: z.number().int().positive().optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  user: z.string().optional()
}).refine(
  data => !(data.functions && data.tools),
  {
    message: "You can provide either 'functions' or 'tools', but not both.",
    path: ['functions', 'tools']
  }
).refine(
  data => !(data.function_call && data.tool_choice),
  {
    message: "You can use either 'function_call' or 'tool_choice', but not both.",
    path: ['function_call', 'tool_choice']
  }
);

/**
 * Type definition for a chat completion request, inferred from the schema.
 * This type can be used for type checking in TypeScript.
 */
export type ChatCompletionRequest = z.infer<typeof chatCompletionSchema>;