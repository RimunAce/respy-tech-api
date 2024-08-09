// Third-party imports
import express from 'express';

// Local imports
import { listModels } from '../../controllers/models';
import { modelsLimiter } from '../../config/rateLimit';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * Express router to handle model listing requests.
 * This router sets up the endpoint for retrieving available models,
 * applying necessary middleware and error handling.
 */
const router = express.Router();

/**
 * GET endpoint for listing available models.
 * 
 * This route:
 * 1. Applies rate limiting to prevent abuse
 * 2. Handles the model listing request asynchronously
 * 3. Catches and forwards any errors to the error middleware
 */
router.get('/', modelsLimiter, asyncHandler(async (req, res) => {
  await listModels(req, res);
}));

/**
 * Export the configured router to be used in the main application.
 */
export default router;