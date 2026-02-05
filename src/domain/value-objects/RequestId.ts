import { randomUUID } from 'node:crypto';

/**
 * Type-safe request identifier with generation logic
 */
export class RequestId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): RequestId {
    return new RequestId(`req_${randomUUID()}`);
  }

  static fromString(value: string): RequestId {
    return new RequestId(value);
  }

  toString(): string {
    return this.value;
  }
}
