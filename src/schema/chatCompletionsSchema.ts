import { z } from 'zod';

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

export const chatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant', 'function']),
      content: messageContentSchema,
      name: z.string().optional(),
      function_call: z.object({
        name: z.string(),
        arguments: z.string()
      }).optional()
    })
  ),
  functions: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.any())
    })
  ).optional(),
  function_call: z.union([
    z.literal('auto'),
    z.literal('none'),
    z.object({ name: z.string() })
  ]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  n: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
  max_tokens: z.number().int().positive().optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  user: z.string().optional()
});

export type ChatCompletionRequest = z.infer<typeof chatCompletionSchema>;