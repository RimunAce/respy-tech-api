import { Response } from 'express';
import logger from '../../../utils/logger';

export class StreamProcessor {
  private buffer: string = '';
  private res: Response;
  private model: string;

  constructor(res: Response, model: string) {
    this.res = res;
    this.model = model;
  }

  /**
   * Processes a chunk of data from the stream.
   * @param chunk - The chunk of data to process
   */
  async processChunk(chunk: Buffer): Promise<void> {
    this.buffer += chunk.toString();
    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          this.res.write(`data: [DONE]\n\n`);
        } else {
          try {
            const parsed = JSON.parse(data);
            this.res.write(`data: ${JSON.stringify(parsed)}\n\n`);
          } catch (error) {
            logger.error('Error parsing stream data:', error);
          }
        }
      }
    }
  }

  /**
   * Ends the stream processing.
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