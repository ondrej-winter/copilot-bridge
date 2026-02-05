import * as vscode from 'vscode';
import { HttpServerAdapter } from './adapters/input/http-server';
import { VSCodeConfigurationAdapter } from './adapters/output/configuration';
import { VSCodeLanguageModelAdapter } from './adapters/output/language-model';
import { VSCodeLoggerAdapter } from './adapters/output/logger';
import { ListModels } from './application/use-cases/ListModels';
import { ProcessChatRequest } from './application/use-cases/ProcessChatRequest';

let httpServer: HttpServerAdapter | null = null;
let outputChannel: vscode.OutputChannel;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  // Create output channel
  outputChannel = vscode.window.createOutputChannel('Copilot Bridge');

  // Create logger adapter
  const logger = new VSCodeLoggerAdapter(outputChannel);
  logger.info('[Extension] Activated');

  // Register start command
  const startCommand = vscode.commands.registerCommand('copilotBridge.start', async () => {
    try {
      await startServer(logger);
    } catch (err) {
      logger.error('[Error] Start command failed', err instanceof Error ? err : undefined);
      vscode.window.showErrorMessage(`Copilot Bridge: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // Register stop command
  const stopCommand = vscode.commands.registerCommand('copilotBridge.stop', async () => {
    try {
      await stopServer(logger);
    } catch (err) {
      logger.error('[Error] Stop command failed', err instanceof Error ? err : undefined);
      vscode.window.showErrorMessage(`Copilot Bridge: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  context.subscriptions.push(startCommand, stopCommand, outputChannel);
}

/**
 * Extension deactivation
 */
export function deactivate() {
  if (httpServer) {
    httpServer.stop().catch(() => {
      // Ignore errors during deactivation
    });
    httpServer = null;
  }
  outputChannel?.appendLine('[Extension] Deactivated');
}

/**
 * Start the bridge server
 */
async function startServer(logger: VSCodeLoggerAdapter): Promise<void> {
  if (httpServer?.isRunning()) {
    vscode.window.showWarningMessage('Copilot Bridge is already running');
    return;
  }

  // Create configuration adapter
  const configAdapter = new VSCodeConfigurationAdapter();
  const config = configAdapter.getConfig();

  // Create language model adapter
  const languageModelAdapter = new VSCodeLanguageModelAdapter(logger, config.defaultFamily);

  // Warm up model selection (triggers consent if needed)
  try {
    logger.info('[Server] Warming up model selection...');
    await languageModelAdapter.sendRequest([], config.defaultFamily).catch(() => {
      // Expected to fail with empty messages, but triggers model selection
    });

    const currentModel = languageModelAdapter.getCurrentModel();
    if (currentModel) {
      logger.info(`[Server] Model ready: ${currentModel.vendor}/${currentModel.family}`);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('[Error] Model selection failed', err instanceof Error ? err : undefined);
    vscode.window.showErrorMessage(`Copilot Bridge: Model selection failed - ${errorMsg}`);
    return;
  }

  // Create use cases
  const processChatRequest = new ProcessChatRequest(languageModelAdapter, logger);
  const listModels = new ListModels(languageModelAdapter, logger);

  // Create HTTP server adapter
  httpServer = new HttpServerAdapter(processChatRequest, listModels, configAdapter, logger);

  // Start server
  try {
    await httpServer.start();
    vscode.window.showInformationMessage(
      `Copilot Bridge started on http://${config.bindAddress}:${config.port}/v1/chat`
    );
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'EADDRINUSE') {
      vscode.window.showErrorMessage(`Copilot Bridge: Port ${config.port} is already in use`);
    } else {
      vscode.window.showErrorMessage(`Copilot Bridge: Server error - ${nodeErr.message || String(err)}`);
    }
    httpServer = null;
    throw err;
  }
}

/**
 * Stop the bridge server
 */
async function stopServer(_logger: VSCodeLoggerAdapter): Promise<void> {
  if (!httpServer?.isRunning()) {
    vscode.window.showWarningMessage('Copilot Bridge is not running');
    return;
  }

  await httpServer.stop();
  httpServer = null;

  vscode.window.showInformationMessage('Copilot Bridge stopped');
}
