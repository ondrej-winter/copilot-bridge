import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatRequestDTO } from '../../../../src/application/dtos/ChatRequestDTO';
import type { LanguageModelPort } from '../../../../src/application/ports/LanguageModelPort';
import type { LoggerPort } from '../../../../src/application/ports/LoggerPort';
import { ProcessChatRequest } from '../../../../src/application/use-cases/ProcessChatRequest';
import { ModelInfo } from '../../../../src/domain/entities/ModelInfo';
import { ValidationError } from '../../../../src/domain/exceptions';

describe('ProcessChatRequest', () => {
  let mockLanguageModelPort: LanguageModelPort;
  let mockLogger: LoggerPort;
  let useCase: ProcessChatRequest;

  beforeEach(() => {
    mockLanguageModelPort = {
      sendRequest: vi.fn(),
      listAvailableModels: vi.fn(),
      getCurrentModel: vi.fn()
    };

    mockLogger = {
      info: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      show: vi.fn()
    };

    useCase = new ProcessChatRequest(mockLanguageModelPort, mockLogger);
  });

  describe('execute', () => {
    it('should process valid chat request', async () => {
      const request: ChatRequestDTO = {
        messages: [{ role: 'user', content: 'Hello, world!' }]
      };

      const mockModel = new ModelInfo('copilot-gpt-4o', 'copilot', 'gpt-4o', 'GPT-4o', 128000);

      vi.mocked(mockLanguageModelPort.sendRequest).mockResolvedValue('Hi there!');
      vi.mocked(mockLanguageModelPort.getCurrentModel).mockReturnValue(mockModel);

      const response = await useCase.execute(request);

      expect(response.id).toMatch(/^req_[a-f0-9-]+$/);
      expect(response.model.vendor).toBe('copilot');
      expect(response.model.family).toBe('gpt-4o');
      expect(response.output_text).toBe('Hi there!');
      expect(response.meta.startedAt).toBeDefined();
      expect(response.meta.endedAt).toBeDefined();
      expect(mockLanguageModelPort.sendRequest).toHaveBeenCalledOnce();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should process request with system and user messages', async () => {
      const request: ChatRequestDTO = {
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hello!' }
        ]
      };

      const mockModel = new ModelInfo('test-id', 'copilot', 'gpt-4o', 'GPT-4o', 128000);

      vi.mocked(mockLanguageModelPort.sendRequest).mockResolvedValue('Response');
      vi.mocked(mockLanguageModelPort.getCurrentModel).mockReturnValue(mockModel);

      const response = await useCase.execute(request);

      expect(response.output_text).toBe('Response');
      expect(mockLanguageModelPort.sendRequest).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: 'You are helpful' }),
          expect.objectContaining({ role: 'user', content: 'Hello!' })
        ]),
        undefined
      );
    });

    it('should pass model family to language model port', async () => {
      const request: ChatRequestDTO = {
        messages: [{ role: 'user', content: 'Test' }],
        model: { family: 'gpt-3.5-turbo' }
      };

      const mockModel = new ModelInfo('test-id', 'copilot', 'gpt-3.5-turbo', 'GPT-3.5', 4096);

      vi.mocked(mockLanguageModelPort.sendRequest).mockResolvedValue('Response');
      vi.mocked(mockLanguageModelPort.getCurrentModel).mockReturnValue(mockModel);

      await useCase.execute(request);

      expect(mockLanguageModelPort.sendRequest).toHaveBeenCalledWith(expect.any(Array), 'gpt-3.5-turbo');
    });

    it('should throw ValidationError when messages array is missing', async () => {
      const request = {} as ChatRequestDTO;

      await expect(useCase.execute(request)).rejects.toThrow(ValidationError);

      await expect(useCase.execute(request)).rejects.toThrow('messages array is required');
    });

    it('should throw ValidationError when messages is not an array', async () => {
      const request = { messages: 'not an array' } as unknown as ChatRequestDTO;

      await expect(useCase.execute(request)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when messages array is empty', async () => {
      const request: ChatRequestDTO = { messages: [] };

      await expect(useCase.execute(request)).rejects.toThrow(ValidationError);

      await expect(useCase.execute(request)).rejects.toThrow('messages array must not be empty');
    });

    it('should throw error when getCurrentModel returns null', async () => {
      const request: ChatRequestDTO = {
        messages: [{ role: 'user', content: 'Test' }]
      };

      vi.mocked(mockLanguageModelPort.sendRequest).mockResolvedValue('Response');
      vi.mocked(mockLanguageModelPort.getCurrentModel).mockReturnValue(null);

      await expect(useCase.execute(request)).rejects.toThrow('No model information available');
    });

    it('should convert DTOs to domain messages', async () => {
      const request: ChatRequestDTO = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
          { role: 'user', content: 'How are you?' }
        ]
      };

      const mockModel = new ModelInfo('test-id', 'copilot', 'gpt-4o', 'GPT-4o', 128000);

      vi.mocked(mockLanguageModelPort.sendRequest).mockResolvedValue('Good!');
      vi.mocked(mockLanguageModelPort.getCurrentModel).mockReturnValue(mockModel);

      await useCase.execute(request);

      const sentMessages = vi.mocked(mockLanguageModelPort.sendRequest).mock.calls[0][0];
      expect(sentMessages).toHaveLength(3);
      expect(sentMessages[0].role).toBe('user');
      expect(sentMessages[1].role).toBe('assistant');
      expect(sentMessages[2].role).toBe('user');
    });

    it('should log request processing', async () => {
      const request: ChatRequestDTO = {
        messages: [{ role: 'user', content: 'Test' }]
      };

      const mockModel = new ModelInfo('test-id', 'copilot', 'gpt-4o', 'GPT-4o', 128000);

      vi.mocked(mockLanguageModelPort.sendRequest).mockResolvedValue('Response');
      vi.mocked(mockLanguageModelPort.getCurrentModel).mockReturnValue(mockModel);

      await useCase.execute(request);

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Processing chat request'));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Validated'));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Completed'));
    });
  });
});
