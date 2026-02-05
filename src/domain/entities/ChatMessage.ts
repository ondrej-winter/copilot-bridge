import { InvalidMessageError } from '../exceptions';

/**
 * Valid message roles in a chat conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Represents a single message in a chat conversation
 */
export class ChatMessage {
  readonly role: MessageRole;
  readonly content: string;

  constructor(role: MessageRole, content: string) {
    this.validateRole(role);
    this.validateContent(content);
    
    this.role = role;
    this.content = content;
  }

  private validateRole(role: MessageRole): void {
    const validRoles: MessageRole[] = ['system', 'user', 'assistant'];
    if (!validRoles.includes(role)) {
      throw new InvalidMessageError(
        `Invalid message role: ${role}. Must be 'system', 'user', or 'assistant'`
      );
    }
  }

  private validateContent(content: string): void {
    if (typeof content !== 'string') {
      throw new InvalidMessageError('Message content must be a string');
    }
    if (content.trim().length === 0) {
      throw new InvalidMessageError('Message content cannot be empty');
    }
  }

  isSystem(): boolean {
    return this.role === 'system';
  }

  isUser(): boolean {
    return this.role === 'user';
  }

  isAssistant(): boolean {
    return this.role === 'assistant';
  }
}
