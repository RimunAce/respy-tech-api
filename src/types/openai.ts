import { Request as ExpressRequest } from 'express';

// Extends the Express Request interface to include API key information
export interface Request extends ExpressRequest {
    apiKeyInfo: {
        id: string;        // Unique identifier for the API key
        premium: boolean;  // Indicates if the key has premium access
        generated: string; // Timestamp or date when the key was generated
    };
}

// Defines the structure for a chat completion request
export interface ChatCompletionRequest {
    model: string;                                     // The model to use for completion
    messages: { role: string; content: string }[];     // Array of message objects
    temperature?: number;                              // Controls randomness (0-2)
    top_p?: number;                                    // Controls diversity via nucleus sampling
    n?: number;                                        // Number of chat completion choices to generate
    stream?: boolean;                                  // Whether to stream back partial progress
    stop?: string | string[];                          // Up to 4 sequences where the API will stop generating
    max_tokens?: number;                               // The maximum number of tokens to generate
    presence_penalty?: number;                         // Penalty for new tokens based on existing frequency
    frequency_penalty?: number;                        // Penalty for new tokens based on frequency in the text
    logit_bias?: { [key: string]: number };            // Modify the likelihood of specified tokens appearing
    user?: string;                                     // A unique identifier representing your end-user
    functions?: {                                      // Descriptions of functions the model may generate JSON inputs for
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }[];
    function_call?: 'auto' | 'none' | { name: string }; // Controls how the model calls functions
}

// Defines the structure for a chat completion response
export interface ChatCompletionResponse {
    id: string;                  // Unique identifier for the response
    object: string;              // Object type, usually "chat.completion"
    created: number;             // Unix timestamp for when the response was created
    model: string;               // The model used for completion
    choices: {                   // Array of generated completions
        index: number;           // Index of the choice in the array
        message: {
            role: string;        // Role of the message (e.g., "assistant")
            content: string;     // The generated message content
        };
        finish_reason: string;   // Reason why the completion finished
    }[];
    usage: {                     // Token usage information
        prompt_tokens: number;   // Number of tokens in the prompt
        completion_tokens: number; // Number of tokens in the completion
        total_tokens: number;    // Total number of tokens used
    };
}

// Configuration for a language model provider
export interface ProviderConfig {
    provider: {
        name: string;                    // Name of the provider
        endpoint: string;                // API endpoint for the provider
        models: Record<string, string>;  // Available models and their identifiers
    };
    apiKey: string;                      // API key for authentication with the provider
}

// Configuration for available models
export interface ModelConfig {
    type: string;           // Type of model configuration
    models: {               // Array of available models
        id: string;         // Unique identifier for the model
        name: string;       // Display name of the model
        owned_by: string;   // Organization or company that owns the model
        premium: boolean;   // Whether the model is considered premium or not
    }[];
}