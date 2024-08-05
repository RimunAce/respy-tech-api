// Third-party imports
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Local imports
import logger from '../utils/logger';

// Comprehensive list of suspicious patterns that might indicate malicious activity
const suspiciousPatterns = [
  '/admin', '/wp-login', '/phpmyadmin', '/.env', '/config', '/backup',
  '/wp-admin', '/wp-content', '/wp-includes', '/xmlrpc.php', '/.git', '/.svn',
  '/shell', '/cgi-bin', '/etc/passwd', '/etc/shadow', '/proc/self/environ',
  '/api/v1/token', '/api/v1/auth', '/actuator', '/swagger-ui.html', '/console',
  '/.well-known', '/robots.txt', '/sitemap.xml', '/vendor', '/node_modules',
  '/.DS_Store', '/composer.json', '/package.json', '/webpack.config.js',
  '/Dockerfile', '/docker-compose.yml', '/.travis.yml', '/jenkins', '/gitlab',
  '/bitbucket', '/jira', '/confluence', '/sonar', '/grafana', '/kibana',
  '/elasticsearch', '/logstash', '/prometheus', '/graphite', '/nagios', '/zabbix'
];

// Endpoint to redirect suspicious requests to
const honeypotEndpoint = '/system';

// Rate limiter configuration to prevent abuse
const rateLimiter = new RateLimiterMemory({
  points: 5,     // Number of allowed requests
  duration: 60,  // Time frame in seconds
});

/**
 * Generates a random response to mimic a real system status endpoint.
 * This helps to make the honeypot more convincing to potential attackers.
 * @returns {Object} A randomly selected response object
 */
function generateRandomResponse() {
  const responses = [
    { status: 'ok', message: 'System is operational', version: '1.2.0' },
    { status: 'running', message: 'All systems nominal', version: '2.0.1' },
    { status: 'active', message: 'Server is responding normally', version: '1.9.5' },
    { status: 'online', message: 'Services are up and running', version: '2.1.3' }
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Middleware to detect and handle suspicious requests.
 * It checks incoming requests against a list of suspicious patterns,
 * logs potential threats, and redirects them to a honeypot endpoint.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export function honeypotMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.path.toLowerCase();

  if (suspiciousPatterns.some(pattern => path.includes(pattern))) {
    // Retrieve client IP, defaulting to 'unknown' if not available
    const clientIp = req.ip || 'unknown';

    // Attempt to consume a point from the rate limiter for this IP
    rateLimiter.consume(clientIp)
      .then(() => {
        // Log detailed information about the suspicious request
        logger.warn(`Suspicious request detected: ${req.method} ${req.path} from IP ${clientIp}`, {
          headers: req.headers,
          query: req.query,
          body: req.body
        });

        // Add a random delay before redirecting to slow down potential attackers
        setTimeout(() => {
          res.redirect(301, honeypotEndpoint);
        }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
      })
      .catch(() => {
        // Log and respond if rate limit is exceeded
        logger.error(`Rate limit exceeded for suspicious request from IP ${clientIp}`);
        res.status(429).json({ error: 'Too many requests' });
      });
  } else {
    // If the request is not suspicious, proceed to the next middleware
    next();
  }
}

/**
 * Handler for the honeypot endpoint.
 * Logs access to the honeypot and sends a randomized response to mimic a real system.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export function honeypotHandler(req: Request, res: Response) {
  const clientIp = req.ip;
  // Log detailed information about the honeypot access
  logger.info(`Honeypot accessed: ${req.method} ${req.path} from IP ${clientIp}`, {
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  // Add a random delay before responding to make the honeypot more realistic
  setTimeout(() => {
    res.status(200).json(generateRandomResponse());
  }, Math.random() * 2000 + 1000); // Random delay between 1000-3000ms
}