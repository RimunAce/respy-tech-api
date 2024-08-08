/* eslint-disable @typescript-eslint/no-explicit-any */

// Third-party imports
import { Response } from 'express';

// Local imports
import logger from '../../../utils/logger';

/**
 * Handles the processing and streaming of chat completion responses.
 * This class manages the buffering, parsing, and sending of streamed data.
 */
export class StreamProcessor {
  private buffer: string = '';
  private res: Response;
  private model: string;

  /**
   * Initializes a new StreamProcessor instance.
   * @param res - The Express Response object to write the stream to.
   * @param model - The name of the AI model being used.
   */
  constructor(res: Response, model: string) {
    this.res = res;
    this.model = model;
  }

  /**
   * Processes a chunk of data from the stream.
   * @param chunk - A Buffer containing a portion of the stream data.
   */
  async processChunk(chunk: Buffer): Promise<void> {
    this.buffer += chunk.toString();
    await this.processBuffer();
  }

  /**
   * Processes the internal buffer, extracting and handling complete lines.
   * This method is called after each chunk is added to the buffer.
   */
  private async processBuffer(): Promise<void> {
    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);
      if (line.startsWith('data: ')) {
        await this.processDataLine(line.slice(6));
      }
    }
  }

  /**
   * Processes a single data line from the stream.
   * @param data - The content of the data line, excluding the 'data: ' prefix.
   */
  private async processDataLine(data: string): Promise<void> {
    if (data === '[DONE]') {
      this.res.write(`data: [DONE]\n\n`);
    } else {
      await this.processJsonData(data);
    }
  }

  /**
   * Parses and processes JSON data from a stream line.
   * @param data - A string containing JSON data to be parsed and processed.
   */
  private async processJsonData(data: string): Promise<void> {
    try {
      const parsed = JSON.parse(data);
      this.handleFunctionCalls(parsed);
      this.res.write(`data: ${JSON.stringify(parsed)}\n\n`);
    } catch (error) {
      logger.error('Error parsing stream data:', error);
    }
  }

  /**
   * Handles function calls within the parsed data.
   * This method modifies the parsed object to properly format function calls.
   * @param parsed - The parsed JSON object containing potential function calls.
   */
  private handleFunctionCalls(parsed: any): void {
    if (parsed.choices[0].delta.function_call) {
      const functionCall = parsed.choices[0].delta.function_call;
      parsed.choices[0].delta.content = null;
      parsed.choices[0].delta.function_call = functionCall.name
        ? { name: functionCall.name }
        : functionCall.arguments
        ? { arguments: functionCall.arguments }
        : {};
    }
  }

  /**
   * Finalizes the stream processing.
   * This method is called when all data has been received and processed.
   */
  async end(): Promise<void> {
    if (this.buffer.trim()) {
      logger.warn(`Unprocessed data in buffer: ${this.buffer}`);
    }
    if (!this.res.writableEnded) {
      this.res.write(`data: [DONE]\n\n`);
      this.res.end();
    }
  }
}