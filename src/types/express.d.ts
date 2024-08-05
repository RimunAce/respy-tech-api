import { ApiKey } from '../middleware/authMiddleware';

declare global {
  namespace Express {
    interface Request {
      apiKeyInfo?: ApiKey;
    }
  }
}