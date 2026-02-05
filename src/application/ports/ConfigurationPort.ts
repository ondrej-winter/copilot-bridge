/**
 * Configuration for the bridge server
 */
export interface BridgeConfig {
  readonly port: number;
  readonly bindAddress: string;
  readonly token: string;
  readonly defaultFamily: string;
  readonly maxBodyBytes: number;
}

/**
 * Port for configuration access
 */
export interface ConfigurationPort {
  /**
   * Get current bridge configuration
   * @returns Current configuration
   */
  getConfig(): BridgeConfig;
}
