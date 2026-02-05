import * as vscode from 'vscode';
import * as http from 'http';
import { randomUUID } from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: {
    family?: string;
  };
}

interface ChatResponse {
  id: string;
  model: {
    vendor: string;
    family: string;
  };
  output_text: string;
  meta: {
    startedAt: string;
    endedAt: string;
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface BridgeConfig {
  port: number;
  bindAddress: string;
  token: string;
  defaultFamily: string;
  maxBodyBytes: number;
}

// ============================================================================
// Global State
// ============================================================================

let httpServer: http.Server | null = null;
let cachedModel: vscode.LanguageModelChat | null = null;
let outputChannel: vscode.OutputChannel;

// ============================================================================
// Configuration
// ============================================================================

function getConfig(): BridgeConfig {
  const config = vscode.workspace.getConfiguration('copilotBridge');
  return {
    port: config.get<number>('port', 32123),
    bindAddress: config.get<string>('bindAddress', '127.0.0.1'),
    token: config.get<string>('token', ''),
    defaultFamily: config.get<string>('defaultFamily', 'gpt-4o'),
    maxBodyBytes: config.get<number>('maxBodyBytes', 1_000_000)
  };
}

// ============================================================================
// Model Selection
// ============================================================================

async function selectChatModel(requestedFamily?: string): Promise<vscode.LanguageModelChat> {
  const config = getConfig();
  const family = requestedFamily || config.defaultFamily;

  outputChannel.appendLine(`[Model] Selecting model with family: ${family}`);

  // Try with requested family first
  let models: vscode.LanguageModelChat[] = [];
  
  if (family && family !== 'auto') {
    models = await vscode.lm.selectChatModels({
      vendor: 'copilot',
      family: family
    });
    outputChannel.appendLine(`[Model] Found ${models.length} models for family '${family}'`);
  }

  // Fallback: any copilot model
  if (models.length === 0) {
    outputChannel.appendLine(`[Model] Falling back to any copilot model`);
    models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
    outputChannel.appendLine(`[Model] Found ${models.length} copilot models`);
  }

  if (models.length === 0) {
    throw new Error('No Copilot models available. Ensure GitHub Copilot is installed and authenticated.');
  }

  const selectedModel = models[0];
  outputChannel.appendLine(`[Model] Selected: ${selectedModel.vendor}/${selectedModel.family} (id: ${selectedModel.id})`);
  
  return selectedModel;
}

// ============================================================================
// Message Processing
// ============================================================================

function prepareMessages(messages: ChatMessage[]): vscode.LanguageModelChatMessage[] {
  const vscodeMessages: vscode.LanguageModelChatMessage[] = [];
  
  // Find system message if any
  const systemMessage = messages.find(m => m.role === 'system');
  let userMessagesStarted = false;

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Skip system messages - we'll prepend them to the first user message
      continue;
    }

    if (msg.role === 'user') {
      let content = msg.content;
      
      // If this is the first user message and we have a system message, prepend it
      if (!userMessagesStarted && systemMessage) {
        content = `[System Instructions]\n${systemMessage.content}\n\n[User Message]\n${content}`;
        userMessagesStarted = true;
      }
      
      vscodeMessages.push(vscode.LanguageModelChatMessage.User(content));
    } else if (msg.role === 'assistant') {
      vscodeMessages.push(vscode.LanguageModelChatMessage.Assistant(msg.content));
    }
  }

  return vscodeMessages;
}

// ============================================================================
// Chat Processing
// ============================================================================

async function processChatRequest(req: ChatRequest): Promise<ChatResponse> {
  const startedAt = new Date().toISOString();
  const requestId = `req_${randomUUID()}`;

  outputChannel.appendLine(`[${requestId}] Processing chat request with ${req.messages.length} messages`);

  // Select model (use cached if available)
  if (!cachedModel) {
    cachedModel = await selectChatModel(req.model?.family);
  }

  const model = cachedModel;

  // Prepare messages
  const vscodeMessages = prepareMessages(req.messages);
  
  if (vscodeMessages.length === 0) {
    throw new Error('No valid messages after processing');
  }

  outputChannel.appendLine(`[${requestId}] Prepared ${vscodeMessages.length} messages for LM`);

  // Send request and buffer response
  const chatRequest = await model.sendRequest(vscodeMessages, {}, new vscode.CancellationTokenSource().token);
  
  let outputText = '';
  
  for await (const fragment of chatRequest.text) {
    outputText += fragment;
  }

  const endedAt = new Date().toISOString();

  outputChannel.appendLine(`[${requestId}] Completed. Output length: ${outputText.length} chars`);

  return {
    id: requestId,
    model: {
      vendor: model.vendor,
      family: model.family
    },
    output_text: outputText,
    meta: {
      startedAt,
      endedAt
    }
  };
}

// ============================================================================
// HTTP Request Validation
// ============================================================================

function isLocalhost(remoteAddress?: string): boolean {
  if (!remoteAddress) {
    return false;
  }
  // Remove IPv6 port suffix if present
  const addr = remoteAddress.replace(/:\d+$/, '');
  return addr === '127.0.0.1' || 
         addr === 'localhost' || 
         addr === '::1' || 
         addr === '::ffff:127.0.0.1';
}

function validateBearerToken(req: http.IncomingMessage, config: BridgeConfig): boolean {
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

// ============================================================================
// HTTP Handler
// ============================================================================

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const config = getConfig();

  // Set CORS headers (only for localhost)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Check localhost
  if (!isLocalhost(req.socket.remoteAddress)) {
    outputChannel.appendLine(`[Security] Rejected non-localhost request from ${req.socket.remoteAddress}`);
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden', details: 'Only localhost requests are allowed' }));
    return;
  }

  // Check bearer token
  if (!validateBearerToken(req, config)) {
    outputChannel.appendLine(`[Security] Invalid or missing bearer token`);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized', details: 'Invalid or missing bearer token' }));
    return;
  }

  // Route handling
  if (req.url === '/v1/chat' && req.method === 'POST') {
    await handleChatRequest(req, res, config);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', details: `Unknown endpoint: ${req.method} ${req.url}` }));
  }
}

async function handleChatRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  config: BridgeConfig
): Promise<void> {
  try {
    // Read body with size limit
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (const chunk of req) {
      totalBytes += chunk.length;
      if (totalBytes > config.maxBodyBytes) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Bad Request', 
          details: `Request body exceeds maximum size of ${config.maxBodyBytes} bytes` 
        }));
        return;
      }
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks).toString('utf8');
    
    // Parse JSON
    let chatRequest: ChatRequest;
    try {
      chatRequest = JSON.parse(body);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Bad Request', 
        details: 'Invalid JSON payload' 
      }));
      return;
    }

    // Validate messages
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages) || chatRequest.messages.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Bad Request', 
        details: 'messages array is required and must not be empty' 
      }));
      return;
    }

    // Validate message roles
    for (const msg of chatRequest.messages) {
      if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Bad Request', 
          details: `Invalid message role: ${msg.role}. Must be 'system', 'user', or 'assistant'` 
        }));
        return;
      }
      if (typeof msg.content !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Bad Request', 
          details: 'Message content must be a string' 
        }));
        return;
      }
    }

    // Process chat request
    const response = await processChatRequest(chatRequest);

    // Send response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));

  } catch (err) {
    outputChannel.appendLine(`[Error] ${err}`);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      details: err instanceof Error ? err.message : String(err)
    };
    res.end(JSON.stringify(errorResponse));
  }
}

// ============================================================================
// Server Management
// ============================================================================

async function startServer(): Promise<void> {
  if (httpServer) {
    vscode.window.showWarningMessage('Copilot Bridge is already running');
    return;
  }

  const config = getConfig();
  
  // Enforce localhost binding
  const bindAddress = config.bindAddress.includes('127.0.0.1') || 
                      config.bindAddress.includes('localhost') || 
                      config.bindAddress.includes('::1')
    ? config.bindAddress
    : '127.0.0.1';

  outputChannel.appendLine(`[Server] Starting on ${bindAddress}:${config.port}`);

  // Warm up model selection (triggers consent if needed)
  try {
    outputChannel.appendLine(`[Server] Warming up model selection...`);
    cachedModel = await selectChatModel();
    outputChannel.appendLine(`[Server] Model ready: ${cachedModel.vendor}/${cachedModel.family}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    outputChannel.appendLine(`[Error] Model selection failed: ${errorMsg}`);
    vscode.window.showErrorMessage(`Copilot Bridge: Model selection failed - ${errorMsg}`);
    return;
  }

  // Create HTTP server
  httpServer = http.createServer((req, res) => {
    handleRequest(req, res).catch(err => {
      outputChannel.appendLine(`[Error] Unhandled request error: ${err}`);
    });
  });

  // Start listening
  await new Promise<void>((resolve, reject) => {
    httpServer!.listen(config.port, bindAddress, () => {
      outputChannel.appendLine(`[Server] Listening on http://${bindAddress}:${config.port}`);
      outputChannel.show(true);
      
      vscode.window.showInformationMessage(
        `Copilot Bridge started on http://${bindAddress}:${config.port}/v1/chat`
      );
      
      resolve();
    });

    httpServer!.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        vscode.window.showErrorMessage(`Copilot Bridge: Port ${config.port} is already in use`);
      } else {
        vscode.window.showErrorMessage(`Copilot Bridge: Server error - ${err.message}`);
      }
      httpServer = null;
      reject(err);
    });
  });
}

async function stopServer(): Promise<void> {
  if (!httpServer) {
    vscode.window.showWarningMessage('Copilot Bridge is not running');
    return;
  }

  outputChannel.appendLine(`[Server] Stopping...`);

  await new Promise<void>((resolve) => {
    httpServer!.close(() => {
      outputChannel.appendLine(`[Server] Stopped`);
      resolve();
    });
  });

  httpServer = null;
  cachedModel = null;

  vscode.window.showInformationMessage('Copilot Bridge stopped');
}

// ============================================================================
// Extension Lifecycle
// ============================================================================

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Copilot Bridge');
  outputChannel.appendLine('[Extension] Activated');

  // Register commands
  const startCommand = vscode.commands.registerCommand('copilotBridge.start', async () => {
    try {
      await startServer();
    } catch (err) {
      outputChannel.appendLine(`[Error] Start command failed: ${err}`);
    }
  });

  const stopCommand = vscode.commands.registerCommand('copilotBridge.stop', async () => {
    try {
      await stopServer();
    } catch (err) {
      outputChannel.appendLine(`[Error] Stop command failed: ${err}`);
    }
  });

  context.subscriptions.push(startCommand, stopCommand, outputChannel);
}

export function deactivate() {
  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }
  cachedModel = null;
  outputChannel?.appendLine('[Extension] Deactivated');
}
