import { describe, expect, it } from 'vitest';
import { ChatMessage } from '../../../../src/domain/entities/ChatMessage';
import { InvalidMessageError } from '../../../../src/domain/exceptions';

describe('ChatMessage', () => {
  describe('constructor', () => {
    it('should create a valid user message', () => {
      const message = new ChatMessage('user', 'Hello, world!');

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, world!');
    });

    it('should create a valid system message', () => {
      const message = new ChatMessage('system', 'You are a helpful assistant.');

      expect(message.role).toBe('system');
      expect(message.content).toBe('You are a helpful assistant.');
    });

    it('should create a valid assistant message', () => {
      const message = new ChatMessage('assistant', 'I can help you with that.');

      expect(message.role).toBe('assistant');
      expect(message.content).toBe('I can help you with that.');
    });

    it('should throw error for invalid role', () => {
      expect(() => new ChatMessage('invalid' as any, 'Hello')).toThrow(InvalidMessageError);

      expect(() => new ChatMessage('invalid' as any, 'Hello')).toThrow(
        "Invalid message role: invalid. Must be 'system', 'user', or 'assistant'"
      );
    });

    it('should throw error for empty content', () => {
      expect(() => new ChatMessage('user', '')).toThrow(InvalidMessageError);

      expect(() => new ChatMessage('user', '')).toThrow('Message content cannot be empty');
    });

    it('should throw error for whitespace-only content', () => {
      expect(() => new ChatMessage('user', '   ')).toThrow(InvalidMessageError);

      expect(() => new ChatMessage('user', '   ')).toThrow('Message content cannot be empty');
    });

    it('should throw error for non-string content', () => {
      expect(() => new ChatMessage('user', null as any)).toThrow(InvalidMessageError);

      expect(() => new ChatMessage('user', null as any)).toThrow('Message content must be a string');
    });
  });

  describe('role helper methods', () => {
    it('should identify system messages', () => {
      const message = new ChatMessage('system', 'You are helpful');

      expect(message.isSystem()).toBe(true);
      expect(message.isUser()).toBe(false);
      expect(message.isAssistant()).toBe(false);
    });

    it('should identify user messages', () => {
      const message = new ChatMessage('user', 'Hello');

      expect(message.isUser()).toBe(true);
      expect(message.isSystem()).toBe(false);
      expect(message.isAssistant()).toBe(false);
    });

    it('should identify assistant messages', () => {
      const message = new ChatMessage('assistant', 'Hi there');

      expect(message.isAssistant()).toBe(true);
      expect(message.isSystem()).toBe(false);
      expect(message.isUser()).toBe(false);
    });
  });

  describe('readonly properties', () => {
    it('should have readonly role and content', () => {
      const message = new ChatMessage('user', 'Hello');

      // TypeScript enforces readonly at compile time
      // This test verifies the properties exist and are accessible
      expect(message.role).toBeDefined();
      expect(message.content).toBeDefined();
    });
  });
});
