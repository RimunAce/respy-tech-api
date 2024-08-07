import fs from 'fs/promises';
import path from 'path';
import logger from '../../../utils/logger';

interface ModelInfo {
  id: string;
  name: string;
  owned_by: string;
  premium: boolean;
}

/**
 * Retrieves information about a specific model.
 * @param modelId - The ID of the model to retrieve information for
 * @returns A promise that resolves to the ModelInfo object
 * @throws Error if the model is not found or there's an issue reading the config
 */
export async function getModelInfo(modelId: string): Promise<ModelInfo> {
  try {
    const configPath = path.resolve(__dirname, '../../../../models/config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    // Find the model information based on the provided modelId
    const modelInfo = config.models.find((model: ModelInfo) => model.id === modelId);
    if (!modelInfo) {
      throw new Error(`Model ${modelId} not found in configuration`);
    }

    return modelInfo;
  } catch (error) {
    logger.error(`Error retrieving model info for ${modelId}:`, error);
    throw new Error(`Failed to retrieve model information for ${modelId}`);
  }
}