// Third-party imports
import express from 'express';

// Local imports
import chatCompletionsRouter from './chatCompletions';
import modelsRouter from './models';

/**
 * Express router to handle v1 API routes.
 * This router sets up the main endpoints for the v1 API,
 * including chat completions and model listing.
 */
const router = express.Router();

/**
 * Mount the chat completions router.
 * This sets up the /chat/completions endpoint for handling chat completion requests.
 */
router.use('/chat/completions', chatCompletionsRouter);

/**
 * Mount the models router.
 * This sets up the /models endpoint for listing available models.
 */
router.use('/models', modelsRouter);

/**
 * Export the configured router to be used in the main application.
 */
export default router;