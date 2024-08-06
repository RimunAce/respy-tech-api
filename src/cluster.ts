// Third-party imports
import cluster from 'cluster';
import chalk from 'chalk';
import os from 'os';

// Local imports
import { createServer } from './server';
import { logCluster, logServer } from './utils/logger';

const NUM_CPUS = os.cpus().length; // or a fixed number if you want
const DEFAULT_PORT = process.env.PORT || 3000;
const WORKER_START_DELAY_MS = 1;

/**
 * Pauses execution for a specified duration.
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the specified duration
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Initializes and starts the cluster.
 */
export async function startCluster(): Promise<void> {
    if (cluster.isPrimary) {
        await initializePrimaryProcess();
    } else {
        initializeWorkerProcess();
    }
}

/**
 * Initializes the primary process, including server setup and worker management.
 */
async function initializePrimaryProcess(): Promise<void> {
    logCluster(`Initializing cluster with ${NUM_CPUS} workers`, 'primary', process.pid);

    const server = createServer();
    const port = process.env.PORT || DEFAULT_PORT;

    server.listen(port, () => {
        logServer(`Server is running on http://localhost:${port}`);
    });

    await spawnWorkers();
    setupWorkerExitHandler();
}

/**
 * Spawns worker processes with a staggered start.
 */
async function spawnWorkers(): Promise<void> {
    const workerPromises = Array.from({ length: NUM_CPUS }, async (_, index) => {
        await sleep(index * WORKER_START_DELAY_MS);
        const worker = cluster.fork();

        return new Promise<void>((resolve) => {
            worker.on('online', () => {
                resolve();
            });
        });
    });

    await Promise.all(workerPromises);
    notifyAllWorkersStarted();
}

/**
 * Notifies that all workers have started.
 */
function notifyAllWorkersStarted(): void {
    // Check if all workers are actually online
    const workerKeys = Object.keys(cluster.workers || {});
    const allWorkersOnline = workerKeys.length === NUM_CPUS && 
        workerKeys.every(key => cluster.workers?.[key]?.isConnected());

    if (allWorkersOnline) {
        logServer(chalk.green(`All ${NUM_CPUS} workers initialized. API is fully operational! ${chalk.yellow('😊')}`));
    } else {
        logServer(chalk.yellow(`Warning: Not all workers are online. Current worker count: ${workerKeys.length}`));
    }
}

/**
 * Sets up the handler for worker exit events.
 */
function setupWorkerExitHandler(): void {
    cluster.on('exit', (worker) => {
        logCluster(`Worker ${worker.process.pid} terminated. Initiating restart...`, 'worker', worker.process.pid ?? 0);
        cluster.fork();
    });
}

/**
 * Initializes a worker process.
 */
function initializeWorkerProcess(): void {
    logCluster(`Worker process initialized`, 'worker', process.pid);
}