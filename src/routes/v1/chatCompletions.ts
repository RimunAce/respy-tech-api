// Third-party imports
import express from 'express';

// Local imports
import { handleChatCompletions } from '../../controllers/chatCompletions';
import { validateApiKey } from '../../middleware/authMiddleware';
import { keyBasedRateLimit } from '../../config/rateLimit';
import { asyncHandler } from '../../utils/asyncHandler';
import { Request } from '../../types/openai';

/**
 * Express router to handle chat completion requests.
 * This router sets up the endpoint for chat completions,
 * applying necessary middleware and error handling.
 */
const router = express.Router();

/**
 * POST endpoint for chat completions.
 * 
 * This route:
 * 1. Validates the API key
 * 2. Applies rate limiting
 * 3. Handles the chat completion request asynchronously
 * 4. Catches and forwards any errors to the error middleware
 */
router.post('/', validateApiKey, keyBasedRateLimit, asyncHandler(async (req: Request, res) => {
  await handleChatCompletions(req, res);
}));

export default router;