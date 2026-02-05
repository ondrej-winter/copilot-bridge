import * as http from 'node:http';
import type { ConfigurationPort } from '../../../application/ports/ConfigurationPort';
import type { LoggerPort } from '../../../application/ports/LoggerPort';
import type { ListModels } from '../../../application/use-cases/ListModels';
import type { ProcessChatRequest } from '../../../application/use-cases/ProcessChatRequest';
import { handleChatRequest, handleModelsRequest, setCorsHeaders } from './routes';
import type { ErrorResponse } from './types';
import { isLocalhost, validateBearerToken } from './validation';

/**
 * HTTP server adapter for Copilot Bridge
 */
export class HttpServerAdapter {
  private server: http.Server | null = null;

  constructor(
    private readonly processChatRequest: ProcessChatRequest,
    private readonly listModels: ListModels,
    private readonly configPort: ConfigurationPort,
    private readonly logger: LoggerPort
  ) {}

  async start(): Promise<void> {
    if (this.server) {
      throw new Error('Server is already running');
    }

    const config = this.configPort.getConfig();

    // Enforce localhost binding
    const bindAddress = this.normalizeBindAddress(config.bindAddress);

    this.logger.info(`[Server] Starting on ${bindAddress}:${config.port}`);

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch((err) => {
        this.logger.error('[Error] Unhandled request error', err);
      });
    });

    // Start listening
    await new Promise<void>((resolve, reject) => {
      this.server!.listen(config.port, bindAddress, () => {
        this.logger.info(`[Server] Listening on http://${bindAddress}:${config.port}`);
        this.logger.show(true);
        resolve();
      });

      this.server!.on('error', (err: NodeJS.ErrnoException) => {
        this.logger.error('[Server] Failed to start', err);
        this.server = null;
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      throw new Error('Server is not running');
    }

    this.logger.info('[Server] Stopping...');

    await new Promise<void>((resolve) => {
      this.server!.close(() => {
        this.logger.info('[Server] Stopped');
        resolve();
      });
    });

    this.server = null;
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const config = this.configPort.getConfig();

    // Set CORS headers
    setCorsHeaders(res);

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Check localhost
    if (!isLocalhost(req.socket.remoteAddress)) {
      this.logger.warning(`[Security] Rejected non-localhost request from ${req.socket.remoteAddress}`);
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Forbidden',
          details: 'Only localhost requests are allowed'
        } as ErrorResponse)
      );
      return;
    }

    // Check bearer token
    if (!validateBearerToken(req, config)) {
      this.logger.warning('[Security] Invalid or missing bearer token');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Invalid or missing bearer token'
        } as ErrorResponse)
      );
      return;
    }

    // Route handling
    if ((req.url === '/v1/chat' || req.url === '/v1/chat/completions') && req.method === 'POST') {
      await handleChatRequest(req, res, this.processChatRequest, config, this.logger);
    } else if (req.url === '/v1/models' && req.method === 'GET') {
      await handleModelsRequest(req, res, this.listModels, this.logger);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Not Found',
          details: `Unknown endpoint: ${req.method} ${req.url}`
        } as ErrorResponse)
      );
    }
  }

  private normalizeBindAddress(bindAddress: string): string {
    // Enforce localhost binding
    if (bindAddress.includes('127.0.0.1') || bindAddress.includes('localhost') || bindAddress.includes('::1')) {
      return bindAddress;
    }
    return '127.0.0.1';
  }
}
