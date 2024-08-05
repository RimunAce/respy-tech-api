import fs from 'fs/promises';
import path from 'path';
import logger from './logger';

interface Provider {
    name: string;
    endpoint: string;
    models: { [key: string]: string };
}

interface ProviderConfig {
    providers: Provider[];
}

interface ModelConfig {
    type: string;
    models: {
        id: string;
        name: string;
        owned_by: string;
        premium: boolean;
    }[];
}

/**
 * Gets the provider for a given model.
 * @param modelId - The ID of the model
 * @returns A promise that resolves to the provider or null if not found
 */
export async function getProviderForModel(modelId: string): Promise<Provider | null> {
    try {
        const [providersData, modelsData] = await Promise.all([
            fs.readFile(path.join(__dirname, '../../providers/chat-completions.json'), 'utf-8'),
            fs.readFile(path.join(__dirname, '../../models/config.json'), 'utf-8')
        ]);

        const providerConfig: ProviderConfig = JSON.parse(providersData);
        const modelConfig: ModelConfig = JSON.parse(modelsData);

        if (!modelConfig.models.some(model => model.id === modelId)) {
            logger.warn(`Model ${modelId} not found in config.json`);
            return null;
        }

        const supportedProviders = providerConfig.providers.filter(provider => modelId in provider.models);

        if (supportedProviders.length === 0) {
            logger.warn(`No provider found for model ${modelId}`);
            return null;
        }

        return supportedProviders[Math.floor(Math.random() * supportedProviders.length)];
    } catch (error) {
        logger.error('Error reading provider or model configuration:', error);
        return null;
    }
}