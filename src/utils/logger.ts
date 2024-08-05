// Third-party imports
import chalk from 'chalk';
import cluster from 'cluster';
import winston from 'winston';
import { IncomingMessage } from 'http';
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

// Create a custom logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            const coloredLevel = level === 'info' ? chalk.blue(level.toUpperCase()) : chalk.red(level.toUpperCase());
            return `${chalk.gray(timestamp)} [${coloredLevel}] ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'api.log' })
    ]
});

/**
 * Logs a cluster-related message.
 * @param message - The message to log
 * @param processType - The type of process (primary or worker)
 * @param pid - The process ID
 */
export function logCluster(message: string, processType: 'primary' | 'worker', pid: number): void {
  const coloredProcessType = processType === 'primary' ? chalk.magenta('PRIMARY') : chalk.cyan('WORKER');
  logger.info(`${coloredProcessType} ${chalk.yellow(`[PID ${pid}]`)}: ${message}`);
}

/**
* Logs a server-related message.
* @param message - The message to log
*/
export function logServer(message: string): void {
  logger.info(`${chalk.green('SERVER')}: ${message}`);
}

/**
* Logs an incoming request.
* @param req - The request object
*/
export function logRequest(req: IncomingMessage & { body?: unknown }): void {
  const { method, url, headers, body, socket } = req;
  const ip = socket.remoteAddress;
  const workerId = cluster.worker ? cluster.worker.id : 'Primary';
  logger.info(chalk.green('Incoming Request:'));
  logger.info(`Worker: ${chalk.cyan(workerId)}`);
  logger.info(`IP: ${chalk.rgb(255, 136, 0)(ip)}`);
  logger.info(`Method: ${chalk.yellow(method)}`);
  logger.info(`URL: ${chalk.yellow(url)}`);
  logger.info(`Headers: ${chalk.cyan(JSON.stringify(headers, null, 2))}`);
  logger.info(`Body: ${chalk.magenta(JSON.stringify(body, null, 2))}`);
}

/**
* Logs an outgoing response.
* @param res - The response object
*/
export function logResponse(res: {
  statusCode: number;
  statusMessage?: string;
  headers?: AxiosResponseHeaders | RawAxiosResponseHeaders;
  body?: unknown;
}): void {
  const { statusCode, statusMessage, headers, body } = res;
  const workerId = cluster.worker ? cluster.worker.id : 'Primary';
  logger.info(chalk.green('Outgoing Response:'));
  logger.info(`Worker: ${chalk.cyan(workerId)}`);
  logger.info(`Status: ${chalk.yellow(statusCode)} ${chalk.yellow(statusMessage || '')}`);
  logger.info(`Headers: ${chalk.cyan(JSON.stringify(headers || {}, null, 2))}`);
  logger.info(`Body: ${chalk.magenta(JSON.stringify(body || {}, null, 2))}`);
}

export default logger;