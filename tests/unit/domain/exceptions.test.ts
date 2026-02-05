import { describe, expect, it } from 'vitest';
import {
  DomainError,
  InvalidMessageError,
  ModelUnavailableError,
  ValidationError
} from '../../../src/domain/exceptions';

describe('Domain Exceptions', () => {
  describe('DomainError', () => {
    it('should create error with message', () => {
      const error = new DomainError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('DomainError');
    });

    it('should support error options with cause', () => {
      const cause = new Error('Original error');
      const error = new DomainError('Wrapped error', { cause });

      expect(error.message).toBe('Wrapped error');
      expect(error.cause).toBe(cause);
    });
  });

  describe('InvalidMessageError', () => {
    it('should create error with message', () => {
      const error = new InvalidMessageError('Invalid message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(InvalidMessageError);
      expect(error.message).toBe('Invalid message');
      expect(error.name).toBe('InvalidMessageError');
    });

    it('should support error options', () => {
      const cause = new Error('Validation failed');
      const error = new InvalidMessageError('Invalid role', { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe('ModelUnavailableError', () => {
    it('should create error with message', () => {
      const error = new ModelUnavailableError('No models available');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(ModelUnavailableError);
      expect(error.message).toBe('No models available');
      expect(error.name).toBe('ModelUnavailableError');
    });
  });

  describe('ValidationError', () => {
    it('should create error with message', () => {
      const error = new ValidationError('Validation failed');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('ValidationError');
    });

    it('should support error options', () => {
      const cause = new Error('Field missing');
      const error = new ValidationError('Invalid request', { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe('error instanceof checks', () => {
    it('should allow catching by base type', () => {
      const errors = [new InvalidMessageError('test'), new ModelUnavailableError('test'), new ValidationError('test')];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(DomainError);
        expect(error).toBeInstanceOf(Error);
      });
    });

    it('should allow catching by specific type', () => {
      try {
        throw new ValidationError('Test validation error');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err).toBeInstanceOf(DomainError);
        expect((err as ValidationError).message).toBe('Test validation error');
      }
    });
  });
});
