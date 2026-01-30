import { z } from "zod";

/**
 * Global skill configuration schema
 */
export const SkillConfigSchema = z.object({
  /** Path to ADB executable */
  adbPath: z.string().min(1).default("adb"),

  /** Default timeout for ADB operations (ms) */
  timeoutMs: z.number().int().positive().default(15000),

  /** Max retries for transient failures */
  maxRetries: z.number().int().min(0).default(1),

  /** Output format */
  outputFormat: z.enum(["text", "json"]).default("text"),

  /** Verbose logging */
  verbose: z.boolean().default(false),

  /** Default device serial (null = auto-select) */
  defaultSerial: z.string().min(1).nullable().default(null),
});

export type SkillConfig = z.infer<typeof SkillConfigSchema>;

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: SkillConfig = SkillConfigSchema.parse({});

/**
 * Merge partial config with defaults
 */
export function mergeConfig(partial: Partial<SkillConfig>): SkillConfig {
  return SkillConfigSchema.parse({
    ...DEFAULT_CONFIG,
    ...partial,
  });
}
