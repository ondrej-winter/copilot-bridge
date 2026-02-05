import { ChatMessage } from '../../domain/entities/ChatMessage';
import { RequestId } from '../../domain/value-objects/RequestId';
import { ValidationError } from '../../domain/exceptions';
import { LanguageModelPort } from '../ports/LanguageModelPort';
import { LoggerPort } from '../ports/LoggerPort';
import { ChatRequestDTO } from '../dtos/ChatRequestDTO';
import { ChatResponseDTO } from '../dtos/ChatResponseDTO';

/**
 * Use case for processing chat requests
 */
export class ProcessChatRequest {
  constructor(
    private readonly languageModelPort: LanguageModelPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(request: ChatRequestDTO): Promise<ChatResponseDTO> {
    const requestId = RequestId.generate();
    const startedAt = new Date().toISOString();

    this.logger.info(`[${requestId}] Processing chat request with ${request.messages.length} messages`);

    // Validate request
    this.validateRequest(request);

    // Convert DTOs to domain entities
    const messages = this.convertToDomainMessages(request);

    this.logger.info(`[${requestId}] Validated ${messages.length} messages`);

    // Send request to language model
    const outputText = await this.languageModelPort.sendRequest(
      messages,
      request.model?.family
    );

    const endedAt = new Date().toISOString();

    // Get current model info
    const currentModel = this.languageModelPort.getCurrentModel();
    if (!currentModel) {
      throw new Error('No model information available');
    }

    this.logger.info(`[${requestId}] Completed. Output length: ${outputText.length} chars`);

    return {
      id: requestId.toString(),
      model: {
        vendor: currentModel.vendor,
        family: currentModel.family
      },
      output_text: outputText,
      meta: {
        startedAt,
        endedAt
      }
    };
  }

  private validateRequest(request: ChatRequestDTO): void {
    if (!request.messages || !Array.isArray(request.messages)) {
      throw new ValidationError('messages array is required');
    }

    if (request.messages.length === 0) {
      throw new ValidationError('messages array must not be empty');
    }
  }

  private convertToDomainMessages(request: ChatRequestDTO): ChatMessage[] {
    return request.messages.map(msg => 
      new ChatMessage(msg.role, msg.content)
    );
  }
}
