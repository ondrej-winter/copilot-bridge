import * as vscode from 'vscode';
import type { LanguageModelPort } from '../../../application/ports/LanguageModelPort';
import type { LoggerPort } from '../../../application/ports/LoggerPort';
import type { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ModelInfo } from '../../../domain/entities/ModelInfo';
import { ModelUnavailableError } from '../../../domain/exceptions';

/**
 * Adapter for VS Code Language Model API
 */
export class VSCodeLanguageModelAdapter implements LanguageModelPort {
  private cachedModel: vscode.LanguageModelChat | null = null;
  private cachedModelInfo: ModelInfo | null = null;

  constructor(
    private readonly logger: LoggerPort,
    private readonly defaultFamily: string
  ) {}

  async sendRequest(messages: ChatMessage[], modelFamily?: string): Promise<string> {
    const family = modelFamily || this.defaultFamily;

    this.logger.info(`[Model] Selecting model with family: ${family}`);

    // Select or reuse cached model
    if (!this.cachedModel) {
      await this.selectAndCacheModel(family);
    }

    const model = this.cachedModel!;

    // Convert domain messages to VS Code format
    const vscodeMessages = this.prepareMessages(messages);

    if (vscodeMessages.length === 0) {
      throw new Error('No valid messages after processing');
    }

    this.logger.info(`[Model] Prepared ${vscodeMessages.length} messages for LM`);

    // Send request and buffer response
    const request = await model.sendRequest(vscodeMessages, {}, new vscode.CancellationTokenSource().token);

    let outputText = '';
    for await (const fragment of request.text) {
      outputText += fragment;
    }

    return outputText;
  }

  async listAvailableModels(): Promise<ModelInfo[]> {
    this.logger.info('[Models] Listing all available Copilot models');

    const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });

    this.logger.info(`[Models] Found ${models.length} total models`);

    return models.map((model) => this.convertToModelInfo(model));
  }

  getCurrentModel(): ModelInfo | null {
    return this.cachedModelInfo;
  }

  private async selectAndCacheModel(family: string): Promise<void> {
    let models: vscode.LanguageModelChat[] = [];

    // Try with requested family first
    if (family && family !== 'auto') {
      models = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: family
      });
      this.logger.info(`[Model] Found ${models.length} models for family '${family}'`);
    }

    // Fallback: any copilot model
    if (models.length === 0) {
      this.logger.info('[Model] Falling back to any copilot model');
      models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
      this.logger.info(`[Model] Found ${models.length} copilot models`);
    }

    if (models.length === 0) {
      throw new ModelUnavailableError(
        'No Copilot models available. Ensure GitHub Copilot is installed and authenticated.'
      );
    }

    this.cachedModel = models[0];
    this.cachedModelInfo = this.convertToModelInfo(models[0]);

    this.logger.info(
      `[Model] Selected: ${this.cachedModelInfo.vendor}/${this.cachedModelInfo.family} (id: ${this.cachedModelInfo.id})`
    );
  }

  private prepareMessages(messages: ChatMessage[]): vscode.LanguageModelChatMessage[] {
    const vscodeMessages: vscode.LanguageModelChatMessage[] = [];

    // Find system message if any
    const systemMessage = messages.find((m) => m.isSystem());
    let userMessagesStarted = false;

    for (const msg of messages) {
      if (msg.isSystem()) {
        continue; // Skip system messages - we'll prepend them to the first user message
      }

      if (msg.isUser()) {
        let content = msg.content;

        // If this is the first user message and we have a system message, prepend it
        if (!userMessagesStarted && systemMessage) {
          content = `[System Instructions]\n${systemMessage.content}\n\n[User Message]\n${content}`;
          userMessagesStarted = true;
        }

        vscodeMessages.push(vscode.LanguageModelChatMessage.User(content));
      } else if (msg.isAssistant()) {
        vscodeMessages.push(vscode.LanguageModelChatMessage.Assistant(msg.content));
      }
    }

    return vscodeMessages;
  }

  private convertToModelInfo(model: vscode.LanguageModelChat): ModelInfo {
    const additionalProperties: Record<string, any> = {};

    // Capture all enumerable properties beyond the known ones
    for (const key in model) {
      if (Object.hasOwn(model, key) && !['id', 'vendor', 'family', 'name', 'maxInputTokens', 'version'].includes(key)) {
        additionalProperties[key] = (model as any)[key];
      }
    }

    return new ModelInfo(
      model.id,
      model.vendor,
      model.family,
      model.name,
      model.maxInputTokens,
      (model as any).version,
      additionalProperties
    );
  }
}
