// Third-party imports
import express from 'express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

// Local imports
import v1Router from './v1';

/**
 * Express router to handle main application routes.
 * This router sets up the primary endpoints and mounts the v1 API routes.
 */
const router = express.Router();

/**
 * Mount the v1 API routes.
 * This sets up all routes under the /v1 path to be handled by the v1Router.
 */
router.use('/v1', v1Router);

/**
 * Root endpoint handler.
 * Provides a welcome message and information about accessing the API.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Respy.Tech API. This is an Invite Only project.',
    howToAccess: 'To request access, please contact me on Discord: respire (188610034849021952)',
    alternativeOption: 'Alternatively, you can clone this open-source API from our GitHub repository and run your own server locally. Visit https://github.com/rimunace/respy-tech-api for instructions.'
  });
});

/**
 * Health check endpoint handler.
 * Returns the current status and timestamp to indicate the API is functioning.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * OpenAPI specification endpoint handler.
 * Serves the OpenAPI specification in JSON format.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 */
router.get('/openapi.json', (req, res) => {
  try {
    const openapiPath = path.join(__dirname, '../../openapi.yaml');
    const openapiContent = fs.readFileSync(openapiPath, 'utf8');
    const openapiJson = yaml.load(openapiContent);
    res.json(openapiJson);
  } catch (error) {
    console.error('Error serving OpenAPI specification:', error);
    res.status(500).json({ error: 'Error serving OpenAPI specification' });
  }
});

/**
 * Export the configured router to be used in the main application.
 */
export default router;