import { z } from "zod";

// ============================================================================
// Shared schemas
// ============================================================================

/** Optional device serial (null = use default/only device) */
export const SerialSchema = z.string().min(1).nullable().default(null);

/** Non-negative integer coordinate */
const CoordSchema = z.number().int().nonnegative();

/** Positive duration in milliseconds */
const DurationMsSchema = z.number().int().positive();

// ============================================================================
// Command input schemas
// ============================================================================

/**
 * check-device: List/verify connected devices
 */
export const CheckDeviceInputSchema = z.object({
	serial: SerialSchema,
});
export type CheckDeviceInput = z.infer<typeof CheckDeviceInputSchema>;

/**
 * wake: Wake device and dismiss lock
 */
export const WakeInputSchema = z.object({
	serial: SerialSchema,
});
export type WakeInput = z.infer<typeof WakeInputSchema>;

/**
 * get-screen: Dump UI XML hierarchy
 */
export const GetScreenInputSchema = z.object({
	serial: SerialSchema,
	/** Include invisible elements */
	includeInvisible: z.boolean().default(false),
});
export type GetScreenInput = z.infer<typeof GetScreenInputSchema>;

/**
 * tap: Tap coordinates
 */
export const TapInputSchema = z.object({
	x: CoordSchema,
	y: CoordSchema,
	serial: SerialSchema,
});
export type TapInput = z.infer<typeof TapInputSchema>;

/**
 * type-text: Type text with escaping
 */
export const TypeTextInputSchema = z.object({
	text: z.string().min(1),
	serial: SerialSchema,
});
export type TypeTextInput = z.infer<typeof TypeTextInputSchema>;

/**
 * swipe: Swipe gesture
 */
export const SwipeInputSchema = z.object({
	startX: CoordSchema,
	startY: CoordSchema,
	endX: CoordSchema,
	endY: CoordSchema,
	durationMs: DurationMsSchema.default(300),
	serial: SerialSchema,
});
export type SwipeInput = z.infer<typeof SwipeInputSchema>;

/**
 * swipe by direction (convenience)
 */
export const SwipeDirectionInputSchema = z.object({
	direction: z.enum(["up", "down", "left", "right"]),
	/** Percentage of screen to swipe (0-100) */
	percent: z.number().min(10).max(100).default(50),
	durationMs: DurationMsSchema.default(300),
	serial: SerialSchema,
});
export type SwipeDirectionInput = z.infer<typeof SwipeDirectionInputSchema>;

/**
 * key: Press keycode
 */
export const KeyInputSchema = z.object({
	/** Keycode number or name (e.g., "HOME", "BACK", 3) */
	key: z.union([z.string().min(1), z.number().int().nonnegative()]),
	serial: SerialSchema,
});
export type KeyInput = z.infer<typeof KeyInputSchema>;

/**
 * screenshot: Capture screen
 */
export const ScreenshotInputSchema = z.object({
	/** Output file path (default: ./screenshot.png) */
	output: z.string().min(1).default("./screenshot.png"),
	serial: SerialSchema,
});
export type ScreenshotInput = z.infer<typeof ScreenshotInputSchema>;

/**
 * launch-app: Launch app by package or name
 */
export const LaunchAppInputSchema = z.object({
	/** Package name or app label */
	app: z.string().min(1),
	/** Specific activity (optional) */
	activity: z.string().min(1).optional(),
	/** Wait for launch to complete */
	wait: z.boolean().default(true),
	/** Clear app data before launch */
	clearData: z.boolean().default(false),
	serial: SerialSchema,
});
export type LaunchAppInput = z.infer<typeof LaunchAppInputSchema>;

/**
 * install-apk: Install APK file
 */
export const InstallApkInputSchema = z.object({
	/** Path to APK file */
	apkPath: z.string().min(1),
	/** Replace existing app */
	replace: z.boolean().default(true),
	/** Allow downgrade */
	downgrade: z.boolean().default(false),
	/** Grant all permissions */
	grantPermissions: z.boolean().default(false),
	serial: SerialSchema,
});
export type InstallApkInput = z.infer<typeof InstallApkInputSchema>;
