/**
 * Detailed model information in response
 */
export interface ModelInfoDetailDTO {
  id: string;
  vendor: string;
  family: string;
  name: string;
  maxInputTokens: number;
  version?: string;
  [key: string]: any;
}

/**
 * Models list response data transfer object
 */
export interface ModelsResponseDTO {
  models: ModelInfoDetailDTO[];
  count: number;
}
