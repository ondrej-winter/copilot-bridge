/**
 * Domain-specific exceptions for Copilot Bridge
 */

/**
 * Base error for all domain exceptions
 */
export class DomainError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DomainError';
  }
}

/**
 * Thrown when a chat message is invalid
 */
export class InvalidMessageError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'InvalidMessageError';
  }
}

/**
 * Thrown when no language models are available
 */
export class ModelUnavailableError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ModelUnavailableError';
  }
}

/**
 * Thrown when request validation fails
 */
export class ValidationError extends DomainError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
  }
}
