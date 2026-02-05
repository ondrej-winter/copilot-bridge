import { describe, expect, it } from 'vitest';
import { RequestId } from '../../../../src/domain/value-objects/RequestId';

describe('RequestId', () => {
  describe('generate', () => {
    it('should generate a unique request ID', () => {
      const id1 = RequestId.generate();
      const id2 = RequestId.generate();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1.toString()).not.toBe(id2.toString());
    });

    it('should generate ID with req_ prefix', () => {
      const id = RequestId.generate();

      expect(id.toString()).toMatch(/^req_[a-f0-9-]+$/);
    });

    it('should generate valid UUID format', () => {
      const id = RequestId.generate();
      const idString = id.toString();

      // Remove "req_" prefix
      const uuid = idString.substring(4);

      // UUID v4 format: 8-4-4-4-12
      expect(uuid).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const id = RequestId.generate();
      const idString = id.toString();

      expect(typeof idString).toBe('string');
      expect(idString.startsWith('req_')).toBe(true);
    });

    it('should return consistent value', () => {
      const id = RequestId.generate();

      expect(id.toString()).toBe(id.toString());
    });
  });

  describe('value property', () => {
    it('should expose readonly value', () => {
      const id = RequestId.generate();

      expect(id.value).toBeDefined();
      expect(typeof id.value).toBe('string');
      expect(id.value.startsWith('req_')).toBe(true);
    });
  });
});
