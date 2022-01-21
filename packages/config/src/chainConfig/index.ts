import {ACTIVE_PRESET} from "@chainsafe/lodestar-params";
import {ChainConfig} from "./types";
import {defaultChainConfig} from "./default";

export * from "./types";
export * from "./default";

/**
 * Create an `ChainConfig`, filling in missing values with preset defaults
 */
export function createChainConfig(input: Partial<ChainConfig>): ChainConfig {
  const config = {
    // Set the config first with default preset values
    ...defaultChainConfig,
    // Override with input
    ...input,
  };

  // Assert that the preset matches the active preset
  if (config.PRESET_BASE !== ACTIVE_PRESET) {
    throw new Error(
      `Can only create a config for the active preset: ACTIVE_PRESET=${ACTIVE_PRESET} PRESET_BASE=${config.PRESET_BASE}`
    );
  }
  return config;
}
