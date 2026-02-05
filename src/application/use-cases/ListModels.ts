import { LanguageModelPort } from '../ports/LanguageModelPort';
import { LoggerPort } from '../ports/LoggerPort';
import { ModelsResponseDTO, ModelInfoDetailDTO } from '../dtos/ModelsResponseDTO';

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

    const modelDTOs: ModelInfoDetailDTO[] = models.map(model => ({
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
