import axios from 'axios';
import logger from './logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const API_URL = 'http://localhost:3000/health'; // URL for the health check endpoint

// Define the structure of the health check response
interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

/**
 * Performs a health check on the API and sends the result to Discord.
 * @async
 * @function checkHealth
 * @throws {Error} If there's an issue with the health check or sending to Discord
 */
async function checkHealth(): Promise<void> {
  try {
    // Make a GET request to the health check endpoint
    const response = await axios.get<HealthCheckResponse>(API_URL);
    const { status, timestamp } = response.data;

    // Determine the color and emoji based on the health status
    const color = status === 'healthy' ? 0x00FF00 : 0xFF0000; // Green for healthy, red for unhealthy
    const emoji = status === 'healthy' ? '✅' : '❌'; // Checkmark for healthy, cross for unhealthy

    // Construct the Discord embed message
    const embed = {
      title: `${emoji} API Health Check`,
      color: color,
      fields: [
        {
          name: 'Status',
          value: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize the first letter
          inline: true,
        },
        {
          name: 'Timestamp',
          value: new Date(timestamp).toLocaleString(),
          inline: true,
        },
      ],
      footer: {
        text: 'Respy Tech API',
      },
    };

    // Send the health check status to Discord if the webhook URL is available
    if (DISCORD_WEBHOOK_URL) {
      await axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] });
      logger.info('Health check status sent to Discord');
    } else {
      logger.warn('Discord webhook URL is not defined. Health check status not sent.');
    }
  } catch (error) {
    // Log the error and prepare an error message for Discord
    logger.error('Error performing health check:', error);

    const errorEmbed = {
      title: '❌ API Health Check Error',
      color: 0xFF0000,
      description: 'Failed to perform health check',
      fields: [
        {
          name: 'Error',
          value: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      footer: {
        text: 'Respy Tech API',
      },
    };

    // Attempt to send the error message to Discord
    if (DISCORD_WEBHOOK_URL) {
      try {
        await axios.post(DISCORD_WEBHOOK_URL, { embeds: [errorEmbed] });
        logger.info('Health check error sent to Discord');
      } catch (discordError) {
        logger.error('Error sending health check status to Discord:', discordError);
      }
    } else {
      logger.warn('Discord webhook URL is not defined. Health check error not sent.');
    }
  }
}

/**
 * Schedules the health check to run at regular intervals.
 * @function scheduleHealthCheck
 * @param {number} intervalMinutes - The interval in minutes between health checks
 */
export function scheduleHealthCheck(intervalMinutes: number): void {
  setInterval(checkHealth, intervalMinutes * 60 * 1000);
  logger.info(`Health check scheduled to run every ${intervalMinutes} minutes on the primary process`);
}