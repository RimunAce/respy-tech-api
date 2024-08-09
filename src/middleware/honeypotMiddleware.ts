// Third-party imports
import { Response, NextFunction } from 'express';
import { Request } from '../types/openai';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import crypto from 'crypto';

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
  '/elasticsearch', '/logstash', '/prometheus', '/graphite', '/nagios', '/zabbix',
  '/wp-config.php', '/config.php', '/.htaccess', '/server-status',
  '/solr', '/jenkins', '/manager/html', '/struts', '/jmx-console'
];

// Endpoint to redirect suspicious requests to
const honeypotEndpoint = '/system';

// Rate limiter configuration to prevent abuse
const rateLimiter = new RateLimiterMemory({
  points: 5,     // Number of allowed requests
  duration: 60,  // Time frame in seconds
});

// Generate a unique session ID for each request
const generateSessionId = () => crypto.randomBytes(16).toString('hex');

/**
 * Generates a more realistic random response to mimic a real system status endpoint.
 * @returns {Object} A randomly selected response object with dynamic data
 */
function generateRandomResponse() {
  const responses = [
    { status: 'ok', message: 'System is operational', version: '1.2.0', uptime: '3d 2h 45m' },
    { status: 'running', message: 'All systems nominal', version: '2.0.1', load: '0.75 0.62 0.48' },
    { status: 'active', message: 'Server is responding normally', version: '1.9.5', memory: '78% used' },
    { status: 'online', message: 'Services are up and running', version: '2.1.3', connections: '1243 active' }
  ];
  const response = responses[Math.floor(Math.random() * responses.length)];
  // Add timestamp to the response object
  return {
    ...response,
    timestamp: new Date().toISOString()
  };
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
  const sessionId = generateSessionId();

  if (suspiciousPatterns.some(pattern => path.includes(pattern))) {
    const clientIp = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    rateLimiter.consume(clientIp)
      .then(() => {
        logger.warn(`Suspicious request detected: ${req.method} ${req.path}`, {
          sessionId,
          clientIp,
          userAgent,
          headers: req.headers,
          query: req.query,
          body: req.body,
          timestamp: new Date().toISOString()
        });

        // Add a fingerprinting cookie to track potential attackers with improved security
        res.cookie('JSESSIONID', crypto.randomBytes(16).toString('hex'), { 
          httpOnly: true,
          secure: true,  // Ensure the cookie is only sent over HTTPS
          sameSite: 'strict'  // Provide additional protection against CSRF attacks
        });

        setTimeout(() => {
          res.redirect(301, honeypotEndpoint);
        }, Math.random() * 1000 + 500);
      })
      .catch(() => {
        logger.error(`Rate limit exceeded for suspicious request`, {
          sessionId,
          clientIp,
          userAgent,
          timestamp: new Date().toISOString()
        });
        res.status(429).json({ error: 'Too many requests', retryAfter: '60 seconds' });
      });
  } else {
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
  const sessionId = generateSessionId();
  const clientIp = req.ip || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  logger.info(`Honeypot accessed`, {
    sessionId,
    clientIp,
    userAgent,
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Simulate server processing time
  setTimeout(() => {
    const response = generateRandomResponse();
    // Add realistic headers
    res.set('Server', 'Apache/2.4.41 (Unix)');
    res.set('X-Powered-By', 'PHP/7.4.3');
    res.status(200).json(response);
  }, Math.random() * 2000 + 1000);
}