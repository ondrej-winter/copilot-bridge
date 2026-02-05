import * as vscode from 'vscode';
import { ConfigurationPort, BridgeConfig } from '../../../application/ports/ConfigurationPort';

/**
 * Adapter for VS Code configuration API
 */
export class VSCodeConfigurationAdapter implements ConfigurationPort {
  getConfig(): BridgeConfig {
    const config = vscode.workspace.getConfiguration('copilotBridge');

    return {
      port: config.get<number>('port', 32123),
      bindAddress: config.get<string>('bindAddress', '127.0.0.1'),
      token: config.get<string>('token', ''),
      defaultFamily: config.get<string>('defaultFamily', 'gpt-4o'),
      maxBodyBytes: config.get<number>('maxBodyBytes', 1_000_000)
    };
  }
}
