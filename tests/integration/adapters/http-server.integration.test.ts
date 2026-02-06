import * as http from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpServerAdapter } from '../../../src/adapters/input/http-server/server';
import type { ConfigurationPort } from '../../../src/application/ports/ConfigurationPort';
import type { LanguageModelPort } from '../../../src/application/ports/LanguageModelPort';
import type { LoggerPort } from '../../../src/application/ports/LoggerPort';
import { ListModels } from '../../../src/application/use-cases/ListModels';
import { ProcessChatRequest } from '../../../src/application/use-cases/ProcessChatRequest';
import { ModelInfo } from '../../../src/domain/entities/ModelInfo';

describe('HTTP Server Integration', () => {
  let server: HttpServerAdapter;
  let mockLanguageModelPort: LanguageModelPort;
  let mockConfigPort: ConfigurationPort;
  let mockLogger: LoggerPort;
  let testPort: number;

  beforeEach(() => {
    testPort = 33000 + Math.floor(Math.random() * 1000);

    mockLanguageModelPort = {
      sendRequest: vi.fn().mockResolvedValue('Mock response'),
      listAvailableModels: vi
        .fn()
        .mockResolvedValue([new ModelInfo('copilot-gpt-4o', 'copilot', 'gpt-4o', 'GPT-4o', 128000)]),
      getCurrentModel: vi.fn().mockReturnValue(new ModelInfo('copilot-gpt-4o', 'copilot', 'gpt-4o', 'GPT-4o', 128000))
    };

    mockConfigPort = {
      getConfig: vi.fn().mockReturnValue({
        port: testPort,
        bindAddress: '127.0.0.1',
        token: '',
        defaultFamily: 'gpt-4o',
        maxBodyBytes: 1000000
      })
    };

    mockLogger = {
      info: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      show: vi.fn()
    };

    const processChatRequest = new ProcessChatRequest(mockLanguageModelPort, mockLogger);
    const listModels = new ListModels(mockLanguageModelPort, mockLogger);

    server = new HttpServerAdapter(processChatRequest, listModels, mockConfigPort, mockLogger);
  });

  afterEach(async () => {
    if (server.isRunning()) {
      await server.stop();
    }
  });

  describe('server lifecycle', () => {
    it('should start and stop server', async () => {
      await server.start();
      expect(server.isRunning()).toBe(true);

      await server.stop();
      expect(server.isRunning()).toBe(false);
    });

    it('should throw error when starting already running server', async () => {
      await server.start();

      await expect(server.start()).rejects.toThrow('Server is already running');

      await server.stop();
    });

    it('should throw error when stopping non-running server', async () => {
      await expect(server.stop()).rejects.toThrow('Server is not running');
    });
  });

  describe('POST /v1/chat', () => {
    beforeEach(async () => {
      await server.start();
    });

    it('should handle valid chat request', async () => {
      const response = await makeRequest('POST', '/v1/chat', {
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.id).toMatch(/^req_[a-f0-9-]+$/);
      expect(data.model.vendor).toBe('copilot');
      expect(data.output_text).toBe('Mock response');
    });

    it('should handle OPTIONS preflight request', async () => {
      const response = await makeRequest('OPTIONS', '/v1/chat');

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should reject invalid JSON', async () => {
      const response = await makeRawRequest('POST', '/v1/chat', 'invalid json');

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Bad Request');
      expect(data.details).toContain('Invalid JSON');
    });

    it('should reject request without messages', async () => {
      const response = await makeRequest('POST', '/v1/chat', {});

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Bad Request');
      expect(data.details).toContain('messages array is required');
    });

    it('should reject empty messages array', async () => {
      const response = await makeRequest('POST', '/v1/chat', { messages: [] });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Bad Request');
    });

    it('should handle bearer token authentication', async () => {
      await server.stop();

      vi.mocked(mockConfigPort.getConfig).mockReturnValue({
        port: testPort,
        bindAddress: '127.0.0.1',
        token: 'test-token',
        defaultFamily: 'gpt-4o',
        maxBodyBytes: 1000000
      });

      await server.start();

      // Request without token should fail
      const failResponse = await makeRequest('POST', '/v1/chat', {
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(failResponse.statusCode).toBe(401);

      // Request with correct token should succeed
      const successResponse = await makeRequest(
        'POST',
        '/v1/chat',
        { messages: [{ role: 'user', content: 'Hello' }] },
        { Authorization: 'Bearer test-token' }
      );

      expect(successResponse.statusCode).toBe(200);
    });
  });

  describe('GET /v1/models', () => {
    beforeEach(async () => {
      await server.start();
    });

    it('should return list of models in OpenAI format', async () => {
      const response = await makeRequest('GET', '/v1/models');

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);

      // Verify OpenAI format
      expect(data.object).toBe('list');
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      // Verify model structure
      const firstModel = data.data[0];
      expect(firstModel.id).toBe('copilot-gpt-4o');
      expect(firstModel.object).toBe('model');
      expect(firstModel.created).toBeDefined();
      expect(typeof firstModel.created).toBe('number');
      expect(firstModel.owned_by).toBe('copilot');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await server.start();
    });

    it('should return 404 for unknown endpoint', async () => {
      const response = await makeRequest('GET', '/unknown');

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.error).toBe('Not Found');
    });

    it('should return 404 for wrong method', async () => {
      const response = await makeRequest('GET', '/v1/chat');

      expect(response.statusCode).toBe(404);
    });
  });

  // Helper functions
  function makeRequest(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port: testPort,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode!,
            headers: res.headers,
            body: responseBody
          });
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  function makeRawRequest(
    method: string,
    path: string,
    body: string,
    headers: Record<string, string> = {}
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port: testPort,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode!,
            headers: res.headers,
            body: responseBody
          });
        });
      });

      req.on('error', reject);

      req.write(body);
      req.end();
    });
  }
});
