import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleChatRequest,
  handleModelsRequest,
  setCorsHeaders
} from '../../../../../src/adapters/input/http-server/routes';
import type { BridgeConfig } from '../../../../../src/application/ports/ConfigurationPort';
import type { LoggerPort } from '../../../../../src/application/ports/LoggerPort';
import type { ListModels } from '../../../../../src/application/use-cases/ListModels';
import type { ProcessChatRequest } from '../../../../../src/application/use-cases/ProcessChatRequest';
import { ValidationError } from '../../../../../src/domain/exceptions';

describe('HTTP Server Routes', () => {
  let mockProcessChatRequest: ProcessChatRequest;
  let mockListModels: ListModels;
  let mockLogger: LoggerPort;
  let mockConfig: BridgeConfig;
  let mockRes: ServerResponse;

  beforeEach(() => {
    mockProcessChatRequest = {
      execute: vi.fn()
    } as any;

    mockListModels = {
      execute: vi.fn()
    } as any;

    mockLogger = {
      info: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      show: vi.fn()
    };

    mockConfig = {
      port: 32123,
      bindAddress: '127.0.0.1',
      token: '',
      defaultFamily: 'gpt-4o',
      maxBodyBytes: 1000000
    };

    mockRes = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn()
    } as any;
  });

  describe('handleChatRequest', () => {
    it('should process valid chat request', async () => {
      const body = JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const req = Readable.from([Buffer.from(body)]) as unknown as IncomingMessage;

      const response = {
        id: 'req_123',
        model: { vendor: 'copilot', family: 'gpt-4o' },
        output_text: 'Hi there!',
        meta: { startedAt: '2024-01-01T00:00:00Z', endedAt: '2024-01-01T00:00:01Z' }
      };

      vi.mocked(mockProcessChatRequest.execute).mockResolvedValue(response);

      await handleChatRequest(req, mockRes, mockProcessChatRequest, mockConfig, mockLogger);

      expect(mockProcessChatRequest.execute).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'Hello' }]
      });
      expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(response, null, 2));
    });

    it('should return 400 for invalid JSON', async () => {
      const req = Readable.from([Buffer.from('invalid json')]) as unknown as IncomingMessage;

      await handleChatRequest(req, mockRes, mockProcessChatRequest, mockConfig, mockLogger);

      expect(mockRes.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'application/json' });
      expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON payload'));
    });

    it('should return 400 for validation errors', async () => {
      const body = JSON.stringify({ messages: [] });
      const req = Readable.from([Buffer.from(body)]) as unknown as IncomingMessage;

      vi.mocked(mockProcessChatRequest.execute).mockRejectedValue(
        new ValidationError('messages array must not be empty')
      );

      await handleChatRequest(req, mockRes, mockProcessChatRequest, mockConfig, mockLogger);

      expect(mockRes.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'application/json' });
      expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('messages array must not be empty'));
    });

    it('should return 400 when body exceeds size limit', async () => {
      const body = 'x'.repeat(mockConfig.maxBodyBytes + 1);
      const req = Readable.from([body]) as unknown as IncomingMessage;

      await handleChatRequest(req, mockRes, mockProcessChatRequest, mockConfig, mockLogger);

      expect(mockRes.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'application/json' });
      expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('exceeds maximum size'));
    });

    it('should return 500 for internal errors', async () => {
      const body = JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }]
      });
      const req = Readable.from([body]) as unknown as IncomingMessage;

      vi.mocked(mockProcessChatRequest.execute).mockRejectedValue(new Error('Internal error'));

      await handleChatRequest(req, mockRes, mockProcessChatRequest, mockConfig, mockLogger);

      expect(mockRes.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
      expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('Internal Server Error'));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleModelsRequest', () => {
    it('should return list of models', async () => {
      const req = {} as IncomingMessage;

      const response = {
        models: [
          {
            id: 'copilot-gpt-4o',
            vendor: 'copilot',
            family: 'gpt-4o',
            name: 'GPT-4o',
            maxInputTokens: 128000
          }
        ],
        count: 1
      };

      vi.mocked(mockListModels.execute).mockResolvedValue(response);

      await handleModelsRequest(req, mockRes, mockListModels, mockLogger);

      expect(mockListModels.execute).toHaveBeenCalledOnce();
      expect(mockRes.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
      expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(response, null, 2));
    });

    it('should return 500 for internal errors', async () => {
      const req = {} as IncomingMessage;

      vi.mocked(mockListModels.execute).mockRejectedValue(new Error('Failed to list models'));

      await handleModelsRequest(req, mockRes, mockListModels, mockLogger);

      expect(mockRes.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
      expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('Internal Server Error'));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('setCorsHeaders', () => {
    it('should set CORS headers', () => {
      setCorsHeaders(mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    });
  });
});
