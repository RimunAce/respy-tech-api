// Third-party imports
import dotenv from 'dotenv';

// Local imports
import { startCluster } from './cluster';

/**
 * Initializes the application by setting up environment variables,
 * starting the cluster, and scheduling health checks.
 * 
 * This function is immediately invoked to ensure the application
 * starts as soon as the file is executed.
 */
(async () => {
    // Load environment variables from .env file
    dotenv.config({ path: '.env' });

    try {
        // Start the cluster, which will set up primary and worker processes
        await startCluster();
    } catch (error) {
        // Log any errors that occur during startup
        console.error('Failed to start the application:', error);
        
        // Exit the process with a non-zero status code to indicate failure
        process.exit(1);
    }
})();