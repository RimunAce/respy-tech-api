/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */

import { ProviderConfig, ChatCompletionRequest } from '../../../types/openai';
import { getProviderAndApiKey } from './providerUtils';
import { createOptimizedConfig } from './configUtils';
import logger from '../../../utils/logger';
import path from 'path';
import fs from 'fs/promises';

// Define a type for the failover function
type FailoverFunction = (request: ChatCompletionRequest) => Promise<ProviderConfig>;

/**
 * Generates a list of alternative providers for a given model.
 * @param currentProvider - The current provider that failed
 * @param model - The model being used
 * @returns A promise that resolves to an array of alternative ProviderConfigs
 */
async function getAlternativeProviders(currentProvider: string, model: string): Promise<ProviderConfig[]> {
    // Read the provider configuration
    const configPath = path.resolve(__dirname, '../../../../providers/chat-completions.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
  
    // Filter providers that support the model and are not the current provider
    const alternativeProviders = config.providers.filter((provider: any) => 
      provider.name !== currentProvider && provider.models[model]
    );
  
    // Convert to ProviderConfig format and fetch API keys
    return Promise.all(alternativeProviders.map(async (provider: any) => {
      const apiKey = process.env[provider.name.toLowerCase()];
      if (!apiKey) {
        throw new Error(`API key not found for provider ${provider.name}`);
      }
      return { provider, apiKey };
    }));
  }

/**
 * Creates a failover function that attempts to use alternative providers if the primary one fails.
 * @param timeout - The timeout in milliseconds before trying the next provider
 * @returns A function that implements the failover logic
 */
export function createFailoverFunction(timeout: number): FailoverFunction {
  return async function failoverFunction(request: ChatCompletionRequest): Promise<ProviderConfig> {
    const originalProvider = await getProviderAndApiKey(request);
    let providers = [originalProvider, ...(await getAlternativeProviders(originalProvider.provider.name, request.model))];

    for (const provider of providers) {
      try {
        // Attempt to create a configuration for the current provider
        const config = createOptimizedConfig(provider, request, request.stream ?? false, request.model);
        
        // Add a timeout to the axios config
        config.timeout = timeout;

        // Here you would typically make the API call
        // For demonstration, we'll just return the provider config after a delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

        logger.info(`Successfully used provider: ${provider.provider.name}`);
        return provider;
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.warn(`Failed to use provider ${provider.provider.name}: ${error.message}`);
        } else {
          logger.warn(`Failed to use provider ${provider.provider.name}: Unknown error`);
        }
        // Continue to the next provider
      }
    }

    // If all providers fail, throw an error
    throw new Error('All providers failed to process the request');
  };
}