import { Response } from 'express';
import { Request } from '../types/openai';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';
import { ModelConfig } from '../types/openai';

/**
 * Lists all available models.
 * @param req - Express request object
 * @param res - Express response object
 */
export async function listModels(req: Request, res: Response): Promise<void> {
    try {
        const modelsData = await readModelConfig();
        const modelConfig: ModelConfig = JSON.parse(modelsData);

        res.json(modelConfig.models);
    } catch (error: unknown) {
        handleModelListingError(res, error);
    }
}

/**
 * Reads the model configuration file.
 * @returns A promise that resolves to the contents of the config file
 * @throws An error if the file cannot be read
 */
async function readModelConfig(): Promise<string> {
    try {
        return await fs.readFile(path.resolve(__dirname, '../../models/config.json'), 'utf-8');
    } catch (error) {
        logger.error('Error reading model configuration:', error);
        throw new Error('Failed to read model configuration');
    }
}

/**
 * Handles errors that occur during model listing.
 * @param res - Express response object
 * @param error - The error that occurred
 */
function handleModelListingError(res: Response, error: unknown): void {
    logger.error('Error listing models:', error);
    res.status(500).json({
        error: 'Failed to retrieve models',
        details: error instanceof Error ? error.message : 'Unknown error'
    });
}