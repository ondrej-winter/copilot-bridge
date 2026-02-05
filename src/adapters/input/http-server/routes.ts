import type * as http from 'node:http';
import type { ChatRequestDTO } from '../../../application/dtos/ChatRequestDTO';
import type { BridgeConfig } from '../../../application/ports/ConfigurationPort';
import type { LoggerPort } from '../../../application/ports/LoggerPort';
import type { ListModels } from '../../../application/use-cases/ListModels';
import type { ProcessChatRequest } from '../../../application/use-cases/ProcessChatRequest';
import { ValidationError } from '../../../domain/exceptions';
import type { ErrorResponse } from './types';
import { readBodyWithLimit } from './validation';

/**
 * Send error response
 */
function sendError(res: http.ServerResponse, status: number, error: string, details?: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  const response: ErrorResponse = { error };
  if (details) {
    response.details = details;
  }
  res.end(JSON.stringify(response));
}

/**
 * Handle POST /v1/chat or /v1/chat/completions
 */
export async function handleChatRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  processChatRequest: ProcessChatRequest,
  config: BridgeConfig,
  logger: LoggerPort
): Promise<void> {
  try {
    // Read body with size limit
    const body = await readBodyWithLimit(req, config.maxBodyBytes);

    // Parse JSON
    let chatRequest: ChatRequestDTO;
    try {
      chatRequest = JSON.parse(body);
    } catch (_err) {
      sendError(res, 400, 'Bad Request', 'Invalid JSON payload');
      return;
    }

    // Process request through use case
    const response = await processChatRequest.execute(chatRequest);

    // Check if this is an OpenAI-compatible request
    const isOpenAIFormat = req.url === '/v1/chat/completions';

    if (isOpenAIFormat) {
      // Transform to OpenAI API format
      const openAIResponse = {
        id: response.id,
        object: 'chat.completion',
        created: Math.floor(new Date(response.meta.startedAt).getTime() / 1000),
        model: response.model.family,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: response.output_text
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(openAIResponse, null, 2));
    } else {
      // Original bridge format
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    }
  } catch (err) {
    logger.error('[Error] Chat request failed', err instanceof Error ? err : undefined);

    if (err instanceof ValidationError) {
      sendError(res, 400, 'Bad Request', err.message);
    } else if (err instanceof Error && err.message.includes('exceeds maximum size')) {
      sendError(res, 400, 'Bad Request', err.message);
    } else {
      sendError(res, 500, 'Internal Server Error', err instanceof Error ? err.message : String(err));
    }
  }
}

/**
 * Handle GET /v1/models
 */
export async function handleModelsRequest(
  _req: http.IncomingMessage,
  res: http.ServerResponse,
  listModels: ListModels,
  logger: LoggerPort
): Promise<void> {
  try {
    const modelsResponse = await listModels.execute();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(modelsResponse, null, 2));
  } catch (err) {
    logger.error('[Error] Models request failed', err instanceof Error ? err : undefined);

    sendError(res, 500, 'Internal Server Error', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Set CORS headers
 */
export function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
