/**
 * Model information in response
 */
export interface ModelInfoDTO {
  vendor: string;
  family: string;
}

/**
 * Response metadata
 */
export interface ResponseMetaDTO {
  startedAt: string;
  endedAt: string;
}

/**
 * Chat response data transfer object
 */
export interface ChatResponseDTO {
  id: string;
  model: ModelInfoDTO;
  output_text: string;
  meta: ResponseMetaDTO;
}
