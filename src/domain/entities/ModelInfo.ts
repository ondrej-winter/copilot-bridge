/**
 * Represents information about a language model
 */
export class ModelInfo {
  readonly id: string;
  readonly vendor: string;
  readonly family: string;
  readonly name: string;
  readonly maxInputTokens: number;
  readonly version?: string;
  readonly additionalProperties: Record<string, any>;

  constructor(
    id: string,
    vendor: string,
    family: string,
    name: string,
    maxInputTokens: number,
    version?: string,
    additionalProperties?: Record<string, any>
  ) {
    this.id = id;
    this.vendor = vendor;
    this.family = family;
    this.name = name;
    this.maxInputTokens = maxInputTokens;
    this.version = version;
    this.additionalProperties = additionalProperties || {};
  }
}
