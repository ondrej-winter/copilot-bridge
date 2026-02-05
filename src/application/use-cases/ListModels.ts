import type { ModelInfoDetailDTO, ModelsResponseDTO } from '../dtos/ModelsResponseDTO';
import type { LanguageModelPort } from '../ports/LanguageModelPort';
import type { LoggerPort } from '../ports/LoggerPort';

/**
 * Use case for listing available language models
 */
export class ListModels {
  constructor(
    private readonly languageModelPort: LanguageModelPort,
    private readonly logger: LoggerPort
  ) {}

  async execute(): Promise<ModelsResponseDTO> {
    this.logger.info('[Models] Listing all available models');

    const models = await this.languageModelPort.listAvailableModels();

    this.logger.info(`[Models] Found ${models.length} total models`);

    const modelDTOs: ModelInfoDetailDTO[] = models.map((model) => ({
      id: model.id,
      vendor: model.vendor,
      family: model.family,
      name: model.name,
      maxInputTokens: model.maxInputTokens,
      version: model.version,
      ...model.additionalProperties
    }));

    return {
      models: modelDTOs,
      count: modelDTOs.length
    };
  }
}
