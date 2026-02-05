import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ModelInfo } from '../../domain/entities/ModelInfo';

/**
 * Port for language model operations
 */
export interface LanguageModelPort {
  /**
   * Send chat messages to the language model and receive a response
   * @param messages - Array of chat messages
   * @param modelFamily - Optional model family to use
   * @returns Buffered response text
   */
  sendRequest(messages: ChatMessage[], modelFamily?: string): Promise<string>;

  /**
   * List all available language models
   * @returns Array of available models
   */
  listAvailableModels(): Promise<ModelInfo[]>;

  /**
   * Get current model information
   * @returns Information about the selected model, or null if no model selected
   */
  getCurrentModel(): ModelInfo | null;
}
