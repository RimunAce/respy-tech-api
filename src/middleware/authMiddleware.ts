/* eslint-disable @typescript-eslint/no-explicit-any */
// Third-party imports
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { Request, Response, NextFunction } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Local imports
import logger from '../utils/logger';

dotenv.config();

// Define interface for API key structure
export interface ApiKey {
    id: string;
    premium: boolean;
    generated: string;
}

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

    // Initialize the S3 client
    const s3Client = new S3Client({
        region: process.env.DO_SPACES_REGION!,
        endpoint: process.env.DO_SPACES_ENDPOINT!,
        credentials: {
            accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
            secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
        },
    });

    try {
        // Fetch the API key file from DigitalOcean Spaces
        const command = new GetObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET!,
            Key: `key/${apiKey}.json`,
        });
        const response = await s3Client.send(command);

        // Convert the response body stream to a string
        const keyData = await streamToString(response.Body as Readable);
        const keyInfo: ApiKey = JSON.parse(keyData);

        req.apiKeyInfo = keyInfo;
        next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        logger.error(`Invalid API Key: ${apiKey}`);
        return res.status(401).json({ error: 'Invalid API Key' });
    }
}

// Code for local key saving in .json format (commented out)
/*
import { Request, Response, NextFunction } from 'express';
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