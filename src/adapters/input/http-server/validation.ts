import type * as http from 'node:http';
import type { BridgeConfig } from '../../../application/ports/ConfigurationPort';

/**
 * Check if request is from localhost
 * @param remoteAddress - Remote address from socket
 * @returns True if localhost, false otherwise
 */
export function isLocalhost(remoteAddress?: string): boolean {
  if (!remoteAddress) {
    return false;
  }
  // Check localhost addresses (with or without port)
  return (
    remoteAddress === '127.0.0.1' ||
    remoteAddress === 'localhost' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1' ||
    remoteAddress.startsWith('127.0.0.1:') ||
    remoteAddress.startsWith('localhost:') ||
    remoteAddress.startsWith('::ffff:127.0.0.1:')
  );
}

/**
 * Validate bearer token from request
 * @param req - HTTP request
 * @param config - Bridge configuration
 * @returns True if valid or no token configured, false otherwise
 */
export function validateBearerToken(req: http.IncomingMessage, config: BridgeConfig): boolean {
  if (!config.token) {
    return true; // No token configured, skip validation
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return false;
  }

  const expectedToken = `Bearer ${config.token}`;
  return authHeader === expectedToken;
}

/**
 * Read request body with size limit
 * @param req - HTTP request
 * @param maxBytes - Maximum body size in bytes
 * @returns Request body as string
 */
export async function readBodyWithLimit(req: http.IncomingMessage, maxBytes: number): Promise<string> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw new Error(`Request body exceeds maximum size of ${maxBytes} bytes`);
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}
