import { describe, expect, test } from "bun:test";
import {
	CheckDeviceInputSchema,
	WakeInputSchema,
	GetScreenInputSchema,
	TapInputSchema,
	TypeTextInputSchema,
	SwipeInputSchema,
	KeyInputSchema,
	ScreenshotInputSchema,
	LaunchAppInputSchema,
	InstallApkInputSchema,
} from "../../core/contracts/inputs.ts";
import {
	SkillConfigSchema,
	DEFAULT_CONFIG,
	mergeConfig,
} from "../../core/contracts/config.ts";

describe("CheckDeviceInputSchema", () => {
	test("accepts null serial", () => {
		const result = CheckDeviceInputSchema.safeParse({ serial: null });
		expect(result.success).toBe(true);
	});

	test("accepts string serial", () => {
		const result = CheckDeviceInputSchema.safeParse({
			serial: "emulator-5554",
		});
		expect(result.success).toBe(true);
	});

	test("defaults serial to null", () => {
		const result = CheckDeviceInputSchema.safeParse({});
		expect(result.success).toBe(true);
		expect(result.data?.serial).toBeNull();
	});

	test("rejects empty string serial", () => {
		const result = CheckDeviceInputSchema.safeParse({ serial: "" });
		expect(result.success).toBe(false);
	});
});

describe("TapInputSchema", () => {
	test("accepts valid coordinates", () => {
		const result = TapInputSchema.safeParse({ x: 100, y: 200 });
		expect(result.success).toBe(true);
		expect(result.data?.x).toBe(100);
		expect(result.data?.y).toBe(200);
	});

	test("rejects negative coordinates", () => {
		expect(TapInputSchema.safeParse({ x: -1, y: 200 }).success).toBe(false);
		expect(TapInputSchema.safeParse({ x: 100, y: -1 }).success).toBe(false);
	});

	test("rejects non-integer coordinates", () => {
		expect(TapInputSchema.safeParse({ x: 1.5, y: 200 }).success).toBe(false);
		expect(TapInputSchema.safeParse({ x: 100, y: 2.5 }).success).toBe(false);
	});

	test("rejects missing coordinates", () => {
		expect(TapInputSchema.safeParse({ x: 100 }).success).toBe(false);
		expect(TapInputSchema.safeParse({ y: 200 }).success).toBe(false);
		expect(TapInputSchema.safeParse({}).success).toBe(false);
	});
});

describe("SwipeInputSchema", () => {
	test("accepts valid swipe", () => {
		const result = SwipeInputSchema.safeParse({
			startX: 0,
			startY: 100,
			endX: 500,
			endY: 100,
		});
		expect(result.success).toBe(true);
		expect(result.data?.durationMs).toBe(300); // default
	});

	test("accepts custom duration", () => {
		const result = SwipeInputSchema.safeParse({
			startX: 0,
			startY: 100,
			endX: 500,
			endY: 100,
			durationMs: 1000,
		});
		expect(result.success).toBe(true);
		expect(result.data?.durationMs).toBe(1000);
	});

	test("rejects zero duration", () => {
		const result = SwipeInputSchema.safeParse({
			startX: 0,
			startY: 100,
			endX: 500,
			endY: 100,
			durationMs: 0,
		});
		expect(result.success).toBe(false);
	});

	test("rejects negative duration", () => {
		const result = SwipeInputSchema.safeParse({
			startX: 0,
			startY: 100,
			endX: 500,
			endY: 100,
			durationMs: -100,
		});
		expect(result.success).toBe(false);
	});
});

describe("TypeTextInputSchema", () => {
	test("accepts valid text", () => {
		const result = TypeTextInputSchema.safeParse({ text: "hello" });
		expect(result.success).toBe(true);
	});

	test("rejects empty text", () => {
		const result = TypeTextInputSchema.safeParse({ text: "" });
		expect(result.success).toBe(false);
	});

	test("accepts text with serial", () => {
		const result = TypeTextInputSchema.safeParse({
			text: "hello",
			serial: "emulator-5554",
		});
		expect(result.success).toBe(true);
	});
});

describe("KeyInputSchema", () => {
	test("accepts string key name", () => {
		const result = KeyInputSchema.safeParse({ key: "HOME" });
		expect(result.success).toBe(true);
	});

	test("accepts numeric keycode", () => {
		const result = KeyInputSchema.safeParse({ key: 3 });
		expect(result.success).toBe(true);
	});

	test("rejects empty string key", () => {
		const result = KeyInputSchema.safeParse({ key: "" });
		expect(result.success).toBe(false);
	});

	test("rejects negative keycode", () => {
		const result = KeyInputSchema.safeParse({ key: -1 });
		expect(result.success).toBe(false);
	});
});

describe("ScreenshotInputSchema", () => {
	test("uses default output path", () => {
		const result = ScreenshotInputSchema.safeParse({});
		expect(result.success).toBe(true);
		expect(result.data?.output).toBe("./screenshot.png");
	});

	test("accepts custom output path", () => {
		const result = ScreenshotInputSchema.safeParse({
			output: "/tmp/screen.png",
		});
		expect(result.success).toBe(true);
		expect(result.data?.output).toBe("/tmp/screen.png");
	});

	test("rejects empty output path", () => {
		const result = ScreenshotInputSchema.safeParse({ output: "" });
		expect(result.success).toBe(false);
	});
});

describe("LaunchAppInputSchema", () => {
	test("accepts package name", () => {
		const result = LaunchAppInputSchema.safeParse({ app: "com.example.app" });
		expect(result.success).toBe(true);
		expect(result.data?.wait).toBe(true); // default
		expect(result.data?.clearData).toBe(false); // default
	});

	test("accepts optional activity", () => {
		const result = LaunchAppInputSchema.safeParse({
			app: "com.example.app",
			activity: ".MainActivity",
		});
		expect(result.success).toBe(true);
		expect(result.data?.activity).toBe(".MainActivity");
	});

	test("rejects empty app", () => {
		const result = LaunchAppInputSchema.safeParse({ app: "" });
		expect(result.success).toBe(false);
	});
});

describe("InstallApkInputSchema", () => {
	test("accepts apk path", () => {
		const result = InstallApkInputSchema.safeParse({
			apkPath: "/path/to/app.apk",
		});
		expect(result.success).toBe(true);
		expect(result.data?.replace).toBe(true); // default
		expect(result.data?.downgrade).toBe(false); // default
		expect(result.data?.grantPermissions).toBe(false); // default
	});

	test("accepts all options", () => {
		const result = InstallApkInputSchema.safeParse({
			apkPath: "/path/to/app.apk",
			replace: false,
			downgrade: true,
			grantPermissions: true,
		});
		expect(result.success).toBe(true);
		expect(result.data?.replace).toBe(false);
		expect(result.data?.downgrade).toBe(true);
		expect(result.data?.grantPermissions).toBe(true);
	});

	test("rejects empty apk path", () => {
		const result = InstallApkInputSchema.safeParse({ apkPath: "" });
		expect(result.success).toBe(false);
	});
});

describe("SkillConfigSchema", () => {
	test("provides sensible defaults", () => {
		const result = SkillConfigSchema.safeParse({});
		expect(result.success).toBe(true);
		expect(result.data?.adbPath).toBe("adb");
		expect(result.data?.timeoutMs).toBe(15000);
		expect(result.data?.maxRetries).toBe(1);
		expect(result.data?.outputFormat).toBe("text");
		expect(result.data?.verbose).toBe(false);
		expect(result.data?.defaultSerial).toBeNull();
	});

	test("accepts custom values", () => {
		const result = SkillConfigSchema.safeParse({
			adbPath: "/usr/bin/adb",
			timeoutMs: 30000,
			maxRetries: 3,
			outputFormat: "json",
			verbose: true,
			defaultSerial: "emulator-5554",
		});
		expect(result.success).toBe(true);
		expect(result.data?.adbPath).toBe("/usr/bin/adb");
		expect(result.data?.timeoutMs).toBe(30000);
		expect(result.data?.outputFormat).toBe("json");
	});

	test("rejects invalid output format", () => {
		const result = SkillConfigSchema.safeParse({ outputFormat: "xml" });
		expect(result.success).toBe(false);
	});

	test("rejects zero timeout", () => {
		const result = SkillConfigSchema.safeParse({ timeoutMs: 0 });
		expect(result.success).toBe(false);
	});

	test("rejects negative retries", () => {
		const result = SkillConfigSchema.safeParse({ maxRetries: -1 });
		expect(result.success).toBe(false);
	});
});

describe("DEFAULT_CONFIG", () => {
	test("matches schema defaults", () => {
		expect(DEFAULT_CONFIG.adbPath).toBe("adb");
		expect(DEFAULT_CONFIG.timeoutMs).toBe(15000);
		expect(DEFAULT_CONFIG.maxRetries).toBe(1);
		expect(DEFAULT_CONFIG.outputFormat).toBe("text");
		expect(DEFAULT_CONFIG.verbose).toBe(false);
		expect(DEFAULT_CONFIG.defaultSerial).toBeNull();
	});
});

describe("mergeConfig", () => {
	test("merges partial config with defaults", () => {
		const merged = mergeConfig({ timeoutMs: 30000 });
		expect(merged.timeoutMs).toBe(30000);
		expect(merged.adbPath).toBe("adb"); // default
	});

	test("returns defaults for empty partial", () => {
		const merged = mergeConfig({});
		expect(merged).toEqual(DEFAULT_CONFIG);
	});
});

describe("GetScreenInputSchema", () => {
	test("defaults includeInvisible to false", () => {
		const result = GetScreenInputSchema.safeParse({});
		expect(result.success).toBe(true);
		expect(result.data?.includeInvisible).toBe(false);
	});

	test("accepts includeInvisible option", () => {
		const result = GetScreenInputSchema.safeParse({ includeInvisible: true });
		expect(result.success).toBe(true);
		expect(result.data?.includeInvisible).toBe(true);
	});
});

describe("WakeInputSchema", () => {
	test("accepts empty input", () => {
		const result = WakeInputSchema.safeParse({});
		expect(result.success).toBe(true);
		expect(result.data?.serial).toBeNull();
	});

	test("accepts serial", () => {
		const result = WakeInputSchema.safeParse({ serial: "emulator-5554" });
		expect(result.success).toBe(true);
	});
});
