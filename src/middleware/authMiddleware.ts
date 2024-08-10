/* eslint-disable @typescript-eslint/no-explicit-any */
// Third-party imports
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { Response, NextFunction } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import NodeCache from 'node-cache';

// Local imports
import logger from '../utils/logger';
import { Request, ApiKey } from '../types/openai';

dotenv.config();

/**
 * Converts a readable stream to a string.
 * @param stream - The readable stream to convert
 * @returns A promise that resolves with the stream contents as a string
 */
const streamToString = (stream: Readable): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });

const initializeS3Client = (): S3Client => {
    return new S3Client({
        region: process.env.DO_SPACES_REGION!,
        endpoint: process.env.DO_SPACES_ENDPOINT!,
        credentials: {
            accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
            secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
        },
    });
};

// Cache configuration
const keyCache = new NodeCache({
  stdTTL: 300, // Cache keys for 5 minutes
  checkperiod: 60, // Check for expired keys every 1 minute
});

const fetchApiKeyData = async (s3Client: S3Client, apiKey: string): Promise<ApiKey> => {
    const cachedData = keyCache.get<ApiKey>(apiKey);
    if (cachedData) {
        logger.info(`Cache hit for API key: ${apiKey}`);
        return cachedData;
    }

    logger.info(`Cache miss for API key: ${apiKey}, fetching from Spaces`);
    const command = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET!,
        Key: `key/${apiKey}.json`,
    });
    const response = await s3Client.send(command);
    const keyData = await streamToString(response.Body as Readable);
    const parsedData: ApiKey = JSON.parse(keyData);

    keyCache.set(apiKey, parsedData);

    return parsedData;
};

/**
 * Middleware to validate the API key in the request header.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const apiKey = authHeader.split(' ')[1];
    logger.info(`API Key used: ${apiKey}`);

    const s3Client = initializeS3Client();

    try {
        const keyInfo = await fetchApiKeyData(s3Client, apiKey);
        req.apiKeyInfo = keyInfo;
        next();
    } catch (error) {
        logger.error(`Invalid API Key: ${apiKey}`, error);
        return res.status(401).json({ error: 'Invalid API Key' });
    }
}

// Code for local key saving in .json format (commented out)
/*
import { Response, NextFunction } from 'express';
import { Request } from '../types/openai';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';

export interface ApiKey {
    id: string;
    premium: boolean;
    generated: string;
}

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const apiKey = authHeader.split(' ')[1];
    logger.info(`API Key used: ${apiKey}`);

    try {
        const keyData = await fs.readFile(path.join(__dirname, `../../key/${apiKey}.json`), 'utf-8');
        const keyInfo: ApiKey = JSON.parse(keyData);

        req.apiKeyInfo = keyInfo;
        next();
    } catch (error) {
        logger.error(`Invalid API Key: ${apiKey}`);
        return res.status(401).json({ error: 'Invalid API Key' });
    }
}
*/