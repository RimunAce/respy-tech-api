/* eslint-disable @typescript-eslint/no-explicit-any */

import stringify from 'json-stringify-safe';

/**
 * Safely stringify an object with potential circular references.
 * It avoids JSON serialization errors by skipping circular references.
 * 
 * @param object - The object to stringify
 * @param indent - Optional number of spaces to indent for pretty output
 * @returns A JSON string representation of the object
 */
export function safeStringify(object: any, indent = 2): string {
    return stringify(object, null, indent);
}