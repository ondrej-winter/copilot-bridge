import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
  isLocalhost,
  readBodyWithLimit,
  validateBearerToken
} from '../../../../../src/adapters/input/http-server/validation';
import type { BridgeConfig } from '../../../../../src/application/ports/ConfigurationPort';

describe('HTTP Server Validation', () => {
  describe('isLocalhost', () => {
    it('should accept 127.0.0.1', () => {
      expect(isLocalhost('127.0.0.1')).toBe(true);
    });

    it('should accept localhost', () => {
      expect(isLocalhost('localhost')).toBe(true);
    });

    it('should accept ::1 (IPv6)', () => {
      expect(isLocalhost('::1')).toBe(true);
    });

    it('should accept ::ffff:127.0.0.1 (IPv4-mapped IPv6)', () => {
      expect(isLocalhost('::ffff:127.0.0.1')).toBe(true);
    });

    it('should reject external IP addresses', () => {
      expect(isLocalhost('192.168.1.100')).toBe(false);
      expect(isLocalhost('10.0.0.1')).toBe(false);
      expect(isLocalhost('8.8.8.8')).toBe(false);
    });

    it('should reject undefined address', () => {
      expect(isLocalhost(undefined)).toBe(false);
    });

    it('should handle addresses with port suffix', () => {
      expect(isLocalhost('127.0.0.1:54321')).toBe(true);
      expect(isLocalhost('192.168.1.1:54321')).toBe(false);
    });
  });

  describe('validateBearerToken', () => {
    it('should return true when no token is configured', () => {
      const req = {
        headers: {}
      } as IncomingMessage;

      const config: BridgeConfig = {
        port: 3000,
        bindAddress: '127.0.0.1',
        token: '',
        defaultFamily: 'gpt-4o',
        maxBodyBytes: 1000000
      };

      expect(validateBearerToken(req, config)).toBe(true);
    });

    it('should return true when token matches', () => {
      const req = {
        headers: {
          authorization: 'Bearer my-secret-token'
        }
      } as IncomingMessage;

      const config: BridgeConfig = {
        port: 3000,
        bindAddress: '127.0.0.1',
        token: 'my-secret-token',
        defaultFamily: 'gpt-4o',
        maxBodyBytes: 1000000
      };

      expect(validateBearerToken(req, config)).toBe(true);
    });

    it('should return false when authorization header is missing', () => {
      const req = {
        headers: {}
      } as IncomingMessage;

      const config: BridgeConfig = {
        port: 3000,
        bindAddress: '127.0.0.1',
        token: 'my-secret-token',
        defaultFamily: 'gpt-4o',
        maxBodyBytes: 1000000
      };

      expect(validateBearerToken(req, config)).toBe(false);
    });

    it('should return false when token does not match', () => {
      const req = {
        headers: {
          authorization: 'Bearer wrong-token'
        }
      } as IncomingMessage;

      const config: BridgeConfig = {
        port: 3000,
        bindAddress: '127.0.0.1',
        token: 'correct-token',
        defaultFamily: 'gpt-4o',
        maxBodyBytes: 1000000
      };

      expect(validateBearerToken(req, config)).toBe(false);
    });

    it('should return false when authorization format is invalid', () => {
      const req = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz'
        }
      } as IncomingMessage;

      const config: BridgeConfig = {
        port: 3000,
        bindAddress: '127.0.0.1',
        token: 'my-token',
        defaultFamily: 'gpt-4o',
        maxBodyBytes: 1000000
      };

      expect(validateBearerToken(req, config)).toBe(false);
    });
  });

  describe('readBodyWithLimit', () => {
    it('should read body within size limit', async () => {
      const body = JSON.stringify({ test: 'data' });
      const stream = Readable.from([Buffer.from(body)]);
      const req = stream as unknown as IncomingMessage;

      const result = await readBodyWithLimit(req, 1000);

      expect(result).toBe(body);
    });

    it('should throw error when body exceeds limit', async () => {
      const body = 'x'.repeat(1001);
      const stream = Readable.from([Buffer.from(body)]);
      const req = stream as unknown as IncomingMessage;

      await expect(readBodyWithLimit(req, 1000)).rejects.toThrow('Request body exceeds maximum size of 1000 bytes');
    });

    it('should handle chunked body within limit', async () => {
      const chunks = [Buffer.from('{"test":'), Buffer.from('"data"}')];
      const stream = Readable.from(chunks);
      const req = stream as unknown as IncomingMessage;

      const result = await readBodyWithLimit(req, 1000);

      expect(result).toBe('{"test":"data"}');
    });

    it('should throw error when chunked body exceeds limit', async () => {
      const chunks = [Buffer.from('a'.repeat(500)), Buffer.from('b'.repeat(501))];
      const stream = Readable.from(chunks);
      const req = stream as unknown as IncomingMessage;

      await expect(readBodyWithLimit(req, 1000)).rejects.toThrow('Request body exceeds maximum size of 1000 bytes');
    });

    it('should handle empty body', async () => {
      const stream = Readable.from([]);
      const req = stream as unknown as IncomingMessage;

      const result = await readBodyWithLimit(req, 1000);

      expect(result).toBe('');
    });

    it('should handle body at exact limit', async () => {
      const body = 'x'.repeat(1000);
      const stream = Readable.from([Buffer.from(body)]);
      const req = stream as unknown as IncomingMessage;

      const result = await readBodyWithLimit(req, 1000);

      expect(result).toBe(body);
    });
  });
});
