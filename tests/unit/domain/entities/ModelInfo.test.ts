import { describe, expect, it } from 'vitest';
import { ModelInfo } from '../../../../src/domain/entities/ModelInfo';

describe('ModelInfo', () => {
  describe('constructor', () => {
    it('should create model info with all properties', () => {
      const model = new ModelInfo('copilot-gpt-4o', 'copilot', 'gpt-4o', 'GPT-4o', 128000, '2024-01-01', {
        custom: 'property'
      });

      expect(model.id).toBe('copilot-gpt-4o');
      expect(model.vendor).toBe('copilot');
      expect(model.family).toBe('gpt-4o');
      expect(model.name).toBe('GPT-4o');
      expect(model.maxInputTokens).toBe(128000);
      expect(model.version).toBe('2024-01-01');
      expect(model.additionalProperties).toEqual({ custom: 'property' });
    });

    it('should create model info without additional properties', () => {
      const model = new ModelInfo('copilot-gpt-4', 'copilot', 'gpt-4', 'GPT-4', 8192);

      expect(model.id).toBe('copilot-gpt-4');
      expect(model.additionalProperties).toEqual({});
    });

    it('should handle undefined version and additional properties', () => {
      const model = new ModelInfo('test-model', 'test-vendor', 'test-family', 'Test Model', 1000);

      expect(model.version).toBeUndefined();
      expect(model.additionalProperties).toEqual({});
    });
  });

  describe('readonly properties', () => {
    it('should have readonly properties', () => {
      const model = new ModelInfo('test-id', 'test-vendor', 'test-family', 'Test Model', 1000);

      // TypeScript enforces readonly at compile time
      expect(model.id).toBeDefined();
      expect(model.vendor).toBeDefined();
      expect(model.family).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.maxInputTokens).toBeDefined();
    });
  });
});
