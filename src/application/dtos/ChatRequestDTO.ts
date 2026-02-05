import { MessageRole } from '../../domain/entities/ChatMessage';

/**
 * Message data transfer object
 */
export interface MessageDTO {
  role: MessageRole;
  content: string;
}

/**
 * Model selection data transfer object
 */
export interface ModelSelectionDTO {
  family?: string;
}

/**
 * Chat request data transfer object
 */
export interface ChatRequestDTO {
  messages: MessageDTO[];
  model?: ModelSelectionDTO;
}
