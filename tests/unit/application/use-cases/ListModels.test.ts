import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LanguageModelPort } from '../../../../src/application/ports/LanguageModelPort';
import type { LoggerPort } from '../../../../src/application/ports/LoggerPort';
import { ListModels } from '../../../../src/application/use-cases/ListModels';
import { ModelInfo } from '../../../../src/domain/entities/ModelInfo';

describe('ListModels', () => {
  let mockLanguageModelPort: LanguageModelPort;
  let mockLogger: LoggerPort;
  let useCase: ListModels;

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

    useCase = new ListModels(mockLanguageModelPort, mockLogger);
  });

  describe('execute', () => {
    it('should list available models', async () => {
      const mockModels = [
        new ModelInfo('copilot-gpt-4o', 'copilot', 'gpt-4o', 'GPT-4o', 128000),
        new ModelInfo('copilot-gpt-4', 'copilot', 'gpt-4', 'GPT-4', 8192)
      ];

      vi.mocked(mockLanguageModelPort.listAvailableModels).mockResolvedValue(mockModels);

      const response = await useCase.execute();

      expect(response.models).toHaveLength(2);
      expect(response.count).toBe(2);
      expect(response.models[0].id).toBe('copilot-gpt-4o');
      expect(response.models[0].vendor).toBe('copilot');
      expect(response.models[0].family).toBe('gpt-4o');
      expect(response.models[0].name).toBe('GPT-4o');
      expect(response.models[0].maxInputTokens).toBe(128000);
      expect(mockLanguageModelPort.listAvailableModels).toHaveBeenCalledOnce();
    });

    it('should return empty list when no models available', async () => {
      vi.mocked(mockLanguageModelPort.listAvailableModels).mockResolvedValue([]);

      const response = await useCase.execute();

      expect(response.models).toHaveLength(0);
      expect(response.count).toBe(0);
    });

    it('should include version in response when available', async () => {
      const mockModels = [new ModelInfo('copilot-gpt-4o', 'copilot', 'gpt-4o', 'GPT-4o', 128000, '2024-01-01')];

      vi.mocked(mockLanguageModelPort.listAvailableModels).mockResolvedValue(mockModels);

      const response = await useCase.execute();

      expect(response.models[0].version).toBe('2024-01-01');
    });

    it('should include additional properties in response', async () => {
      const mockModels = [
        new ModelInfo('test-id', 'test-vendor', 'test-family', 'Test Model', 1000, undefined, {
          custom: 'property',
          another: 'value'
        })
      ];

      vi.mocked(mockLanguageModelPort.listAvailableModels).mockResolvedValue(mockModels);

      const response = await useCase.execute();

      expect(response.models[0]).toMatchObject({
        id: 'test-id',
        vendor: 'test-vendor',
        family: 'test-family',
        name: 'Test Model',
        maxInputTokens: 1000,
        custom: 'property',
        another: 'value'
      });
    });

    it('should log model listing', async () => {
      const mockModels = [new ModelInfo('test-id', 'copilot', 'gpt-4o', 'GPT-4o', 128000)];

      vi.mocked(mockLanguageModelPort.listAvailableModels).mockResolvedValue(mockModels);

      await useCase.execute();

      expect(mockLogger.info).toHaveBeenCalledWith('[Models] Listing all available models');
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Found 1 total models'));
    });

    it('should handle multiple models correctly', async () => {
      const mockModels = [
        new ModelInfo('model-1', 'vendor-1', 'family-1', 'Model 1', 1000),
        new ModelInfo('model-2', 'vendor-2', 'family-2', 'Model 2', 2000),
        new ModelInfo('model-3', 'vendor-3', 'family-3', 'Model 3', 3000)
      ];

      vi.mocked(mockLanguageModelPort.listAvailableModels).mockResolvedValue(mockModels);

      const response = await useCase.execute();

      expect(response.count).toBe(3);
      expect(response.models).toHaveLength(3);
      expect(response.models.map((m) => m.id)).toEqual(['model-1', 'model-2', 'model-3']);
    });
  });
});
