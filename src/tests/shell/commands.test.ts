import { describe, expect, test } from "bun:test";
import type { CommandContext } from "@shell/registry.ts";
import { createTraceBuilder } from "@core/types/trace.ts";
import { DEFAULT_CONFIG } from "@core/contracts/config.ts";
import {
	createMockAdbProvider,
	MOCK_DEVICES_RESPONSE,
	MOCK_NO_DEVICES_RESPONSE,
} from "@shell/providers/adb-mock.ts";

// Import commands (they self-register but we'll use them directly)
import { checkDevice } from "@shell/commands/check-device.ts";
import { tap } from "@shell/commands/tap.ts";
import { swipe } from "@shell/commands/swipe.ts";
import { key } from "@shell/commands/key.ts";
import { typeText } from "@shell/commands/type-text.ts";
import { wake } from "@shell/commands/wake.ts";

function createTestContext(
	mockProvider = createMockAdbProvider(),
): CommandContext {
	return {
		adb: mockProvider,
		config: DEFAULT_CONFIG,
		trace: createTraceBuilder("test"),
	};
}

describe("check-device command", () => {
	test("lists connected devices", async () => {
		const mock = createMockAdbProvider();
		mock.setResponse("devices -l", { stdout: MOCK_DEVICES_RESPONSE });

		const result = await checkDevice([], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.data?.count).toBe(2);
		expect(result.data?.devices).toHaveLength(2);
		expect(result.data?.devices[0]?.serial).toBe("emulator-5554");
	});

	test("returns empty list when no devices", async () => {
		const mock = createMockAdbProvider();
		mock.setResponse("devices -l", { stdout: MOCK_NO_DEVICES_RESPONSE });

		const result = await checkDevice([], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.data?.count).toBe(0);
		expect(result.data?.devices).toHaveLength(0);
	});

	test("verifies specific device exists", async () => {
		const mock = createMockAdbProvider();
		mock.setResponse("devices -l", { stdout: MOCK_DEVICES_RESPONSE });

		const result = await checkDevice(
			["emulator-5554"],
			createTestContext(mock),
		);

		expect(result.success).toBe(true);
	});

	test("fails for non-existent device", async () => {
		const mock = createMockAdbProvider();
		mock.setResponse("devices -l", { stdout: MOCK_DEVICES_RESPONSE });

		const result = await checkDevice(["nonexistent"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("DEVICE_NOT_FOUND");
	});

	test("fails for unauthorized device", async () => {
		const mock = createMockAdbProvider();
		mock.setResponse("devices -l", {
			stdout: `List of devices attached
ABC123	unauthorized
`,
		});

		const result = await checkDevice(["ABC123"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("DEVICE_UNAUTHORIZED");
	});

	test("fails for offline device", async () => {
		const mock = createMockAdbProvider();
		mock.setResponse("devices -l", {
			stdout: `List of devices attached
ABC123	offline
`,
		});

		const result = await checkDevice(["ABC123"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("DEVICE_OFFLINE");
	});

	test("handles ADB failure", async () => {
		const mock = createMockAdbProvider();
		mock.setResponse("devices -l", {
			exitCode: 1,
			stderr: "adb server not running",
		});

		const result = await checkDevice([], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("ADB_FAILED");
	});
});

describe("tap command", () => {
	test("taps at coordinates", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await tap(["500", "800"], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.data?.x).toBe(500);
		expect(result.data?.y).toBe(800);
		expect(mock.wasCalled("input tap 500 800")).toBe(true);
	});

	test("fails with invalid coordinates", async () => {
		const mock = createMockAdbProvider();

		const result = await tap(["abc", "def"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("INVALID_INPUT");
	});

	test("fails with negative coordinates", async () => {
		const mock = createMockAdbProvider();

		const result = await tap(["-100", "200"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("INVALID_INPUT");
	});

	test("fails with missing coordinates", async () => {
		const mock = createMockAdbProvider();

		const result = await tap(["500"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("INVALID_INPUT");
	});

	test("handles ADB failure", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 1, stderr: "Error" });

		const result = await tap(["500", "800"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("ADB_FAILED");
	});
});

describe("swipe command", () => {
	test("performs swipe gesture", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await swipe(
			["100", "200", "300", "400", "500"],
			createTestContext(mock),
		);

		expect(result.success).toBe(true);
		expect(result.data?.startX).toBe(100);
		expect(result.data?.startY).toBe(200);
		expect(result.data?.endX).toBe(300);
		expect(result.data?.endY).toBe(400);
		expect(result.data?.durationMs).toBe(500);
		expect(mock.wasCalled("input swipe")).toBe(true);
	});

	test("uses default duration", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await swipe(
			["100", "200", "300", "400"],
			createTestContext(mock),
		);

		expect(result.success).toBe(true);
		expect(result.data?.durationMs).toBe(300); // default
	});

	test("fails with invalid coordinates", async () => {
		const mock = createMockAdbProvider();

		const result = await swipe(["a", "b", "c", "d"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("INVALID_INPUT");
	});
});

describe("key command", () => {
	test("presses key by name", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await key(["HOME"], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.data?.keycode).toBe(3);
		expect(result.data?.keyName).toBe("HOME");
		expect(mock.wasCalled("keyevent 3")).toBe(true);
	});

	test("presses key by code", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await key(["66"], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.data?.keycode).toBe(66);
		expect(result.data?.keyName).toBe("ENTER");
	});

	test("handles case-insensitive key names", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await key(["back"], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.data?.keycode).toBe(4);
	});

	test("fails for unknown key name", async () => {
		const mock = createMockAdbProvider();

		const result = await key(["UNKNOWN_KEY"], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("INVALID_INPUT");
	});

	test("fails with empty key", async () => {
		const mock = createMockAdbProvider();

		const result = await key([], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("INVALID_INPUT");
	});
});

describe("type-text command", () => {
	test("types simple text", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await typeText(["hello"], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.data?.text).toBe("hello");
		expect(result.data?.length).toBe(5);
		expect(mock.wasCalled("input text")).toBe(true);
	});

	test("handles text with spaces", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await typeText(["hello", "world"], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.data?.text).toBe("hello world");
	});

	test("warns about non-ASCII characters", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await typeText(["hello😀"], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(result.warnings).toBeDefined();
		expect(result.warnings?.[0]).toContain("non-ASCII");
	});

	test("fails with empty text", async () => {
		const mock = createMockAdbProvider();

		const result = await typeText([], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("INVALID_INPUT");
	});
});

describe("wake command", () => {
	test("wakes device", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await wake([], createTestContext(mock));

		expect(result.success).toBe(true);
		expect(mock.wasCalled("keyevent")).toBe(true);
	});

	test("handles ADB failure", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 1, stderr: "Error" });

		const result = await wake([], createTestContext(mock));

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("ADB_FAILED");
	});
});

describe("command tracing", () => {
	test("records ADB calls in trace", async () => {
		const mock = createMockAdbProvider();
		mock.setDefaultResponse({ exitCode: 0 });

		const result = await tap(["100", "200"], createTestContext(mock));

		expect(result.trace).toBeDefined();
		expect(result.trace?.adbCalls.length).toBeGreaterThan(0);
		expect(result.trace?.command).toBe("test");
	});
});
