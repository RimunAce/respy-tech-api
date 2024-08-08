/* eslint-disable @typescript-eslint/no-unused-vars */
// Third-party imports
import express, { Request, Response, NextFunction } from 'express';

// Local imports
import { handleChatCompletions } from '../controllers/chatCompletions';
import { listModels } from '../controllers/models';
import logger from '../utils/logger';
import { validateApiKey } from '../middleware/authMiddleware';
import { Request as CustomRequest } from '../types/openai';
import { createErrorResponse } from '../utils/errorHandling';

const router = express.Router();

/**
 * Wraps an async route handler to catch and forward errors to the error middleware.
 * @param fn - The async route handler function
 * @returns A function that handles the route and catches any errors
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => 
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

// Chat completions route
router.post('/chat/completions', validateApiKey, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check if apiKeyInfo is defined before proceeding
        if (!req.apiKeyInfo) {
            throw new Error('API key information is missing');
        }
        
        logger.info('Received chat completion request');
        await handleChatCompletions(req as CustomRequest, res);
    } catch (error) {
        // If headers haven't been sent, send an error response
        if (!res.headersSent) {
            if (error instanceof Error) {
                res.status(500).json(createErrorResponse(500, error.message));
            } else {
                res.status(500).json(createErrorResponse(500, 'An unknown error occurred'));
            }
        } else {
            logger.error('Error occurred after headers were sent:', error);
        }
    }
}));

// List models route
router.get('/models', asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received request to list models');
    await listModels(req, res);
}));

export default router;