import { performance } from 'perf_hooks';
import logger from '../../../utils/logger';

/**
 * Logs the performance metrics of the request.
 * @param startTime - The start time of the request
 */
export function logPerformance(startTime: number): void {
  const timeTaken = performance.now() - startTime;
  logger.info(`[PERFORMANCE] Response time: ${(timeTaken / 1000).toFixed(2)} seconds`);
}