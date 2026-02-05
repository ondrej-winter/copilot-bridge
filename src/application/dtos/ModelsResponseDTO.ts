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

/**
 * OpenAI-compatible model object
 */
export interface OpenAIModelDTO {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

/**
 * OpenAI-compatible models list response
 */
export interface ModelsListOpenAIDTO {
  object: 'list';
  data: OpenAIModelDTO[];
}
