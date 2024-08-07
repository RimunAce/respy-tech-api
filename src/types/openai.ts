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
    model: string; // The model to be used for generating responses
    messages: { // Array of messages to be sent in the request
        role: string; // Role of the message sender (e.g., "user" or "assistant")
        content: string | Array<{ // Content of the message, can be a string or an array of objects
            type: 'text' | 'image_url'; // Type of content, either text or image URL
            text?: string; // Optional text content
            image_url?: { // Optional image URL object
                url: string; // URL of the image
                detail?: 'low' | 'high' | 'auto'; // Optional detail level for the image
            };
        }>;
    }[];
    temperature?: number; // Sampling temperature for randomness in responses
    top_p?: number; // Nucleus sampling parameter
    n?: number; // Number of completions to generate
    stream?: boolean; // Whether to stream the response
    stop?: string | string[]; // Stop sequences for the response
    max_tokens?: number; // Maximum number of tokens to generate
    presence_penalty?: number; // Penalty for new tokens based on their presence in the text so far
    frequency_penalty?: number; // Penalty for new tokens based on their frequency in the text so far
    logit_bias?: { [key: string]: number }; // Biases to apply to specific tokens
    user?: string; // Optional user identifier
    functions?: { // Optional array of functions to be called
        name: string; // Name of the function
        description: string; // Description of the function
        parameters: Record<string, unknown>; // Parameters for the function
    }[];
    function_call?: 'auto' | 'none' | { name: string }; // Specifies how to handle function calls
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