import { z } from "zod";

// ============================================================================
// Output schemas for structured --json responses
// ============================================================================

/**
 * Device info output (from check-device)
 */
export const DeviceOutputSchema = z.object({
  serial: z.string(),
  state: z.enum([
    "device",
    "offline",
    "unauthorized",
    "no permissions",
    "bootloader",
    "recovery",
    "sideload",
    "unknown",
  ]),
  transport: z.enum(["usb", "wifi", "unknown"]),
  product: z.string().optional(),
  model: z.string().optional(),
  device: z.string().optional(),
  transportId: z.string().optional(),
});
export type DeviceOutput = z.infer<typeof DeviceOutputSchema>;

/**
 * check-device output
 */
export const CheckDeviceOutputSchema = z.object({
  devices: z.array(DeviceOutputSchema),
  count: z.number().int().nonnegative(),
});
export type CheckDeviceOutput = z.infer<typeof CheckDeviceOutputSchema>;

/**
 * wake output
 */
export const WakeOutputSchema = z.object({
  wasAsleep: z.boolean(),
  isAwake: z.boolean(),
});
export type WakeOutput = z.infer<typeof WakeOutputSchema>;

/**
 * get-screen output
 */
export const GetScreenOutputSchema = z.object({
  xml: z.string(),
  byteSize: z.number().int().nonnegative(),
});
export type GetScreenOutput = z.infer<typeof GetScreenOutputSchema>;

/**
 * tap output
 */
export const TapOutputSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});
export type TapOutput = z.infer<typeof TapOutputSchema>;

/**
 * type-text output
 */
export const TypeTextOutputSchema = z.object({
  text: z.string(),
  length: z.number().int().nonnegative(),
});
export type TypeTextOutput = z.infer<typeof TypeTextOutputSchema>;

/**
 * swipe output
 */
export const SwipeOutputSchema = z.object({
  startX: z.number().int(),
  startY: z.number().int(),
  endX: z.number().int(),
  endY: z.number().int(),
  durationMs: z.number().int(),
});
export type SwipeOutput = z.infer<typeof SwipeOutputSchema>;

/**
 * key output
 */
export const KeyOutputSchema = z.object({
  keycode: z.number().int(),
  keyName: z.string().optional(),
});
export type KeyOutput = z.infer<typeof KeyOutputSchema>;

/**
 * screenshot output
 */
export const ScreenshotOutputSchema = z.object({
  path: z.string(),
  byteSize: z.number().int().nonnegative(),
});
export type ScreenshotOutput = z.infer<typeof ScreenshotOutputSchema>;

/**
 * launch-app output
 */
export const LaunchAppOutputSchema = z.object({
  packageName: z.string(),
  activity: z.string().optional(),
  launchTime: z.number().int().nonnegative().optional(),
});
export type LaunchAppOutput = z.infer<typeof LaunchAppOutputSchema>;

/**
 * install-apk output
 */
export const InstallApkOutputSchema = z.object({
  packageName: z.string(),
  versionName: z.string().optional(),
  wasReplaced: z.boolean(),
});
export type InstallApkOutput = z.infer<typeof InstallApkOutputSchema>;

// ============================================================================
// CommandResult schema (for --json output validation)
// ============================================================================

export const ErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "ADB_FAILED",
  "TIMEOUT",
  "CANCELLED",
  "DEVICE_NOT_FOUND",
  "DEVICE_OFFLINE",
  "DEVICE_UNAUTHORIZED",
  "FILE_NOT_FOUND",
  "PARSE_ERROR",
  "UNKNOWN",
]);

export const ResultErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
});

export const AdbCallSchema = z.object({
  args: z.array(z.string()),
  durationMs: z.number(),
  exitCode: z.number().optional(),
  error: z.string().optional(),
});

export const ExecutionTraceSchema = z.object({
  command: z.string(),
  startTimeMs: z.number(),
  endTimeMs: z.number(),
  durationMs: z.number(),
  adbCalls: z.array(AdbCallSchema),
  errors: z.array(z.string()),
});

/**
 * Generic CommandResult schema
 */
export const CommandResultSchema = z.object({
  success: z.boolean(),
  exitCode: z.number().int(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  error: ResultErrorSchema.optional(),
  warnings: z.array(z.string()).optional(),
  trace: ExecutionTraceSchema.optional(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});
export type CommandResultOutput = z.infer<typeof CommandResultSchema>;
