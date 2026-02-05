import * as vscode from 'vscode';
import { LoggerPort } from '../../../application/ports/LoggerPort';

/**
 * Adapter for VS Code OutputChannel logging
 */
export class VSCodeLoggerAdapter implements LoggerPort {
  constructor(private readonly outputChannel: vscode.OutputChannel) {}

  debug(message: string): void {
    this.log('DEBUG', message);
  }

  info(message: string): void {
    this.log('INFO', message);
  }

  warning(message: string): void {
    this.log('WARNING', message);
  }

  error(message: string, error?: Error): void {
    if (error) {
      this.log('ERROR', `${message}: ${error.message}`);
      if (error.stack) {
        this.outputChannel.appendLine(error.stack);
      }
    } else {
      this.log('ERROR', message);
    }
  }

  show(preserveFocus?: boolean): void {
    this.outputChannel.show(preserveFocus);
  }

  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
  }
}
