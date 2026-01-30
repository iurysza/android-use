import { describe, expect, test, beforeEach } from "bun:test";
import { registry, registerCommand } from "../../shell/registry.ts";
import type { CommandContext, CommandHandler } from "../../shell/registry.ts";
import { ok } from "../../core/types/result.ts";
import { createTraceBuilder } from "../../core/types/trace.ts";
import { DEFAULT_CONFIG } from "../../core/contracts/config.ts";
import { createMockAdbProvider } from "../../shell/providers/adb-mock.ts";

function createTestContext(): CommandContext {
	return {
		adb: createMockAdbProvider(),
		config: DEFAULT_CONFIG,
		trace: createTraceBuilder("test"),
	};
}

describe("registry", () => {
	beforeEach(() => {
		registry.reset();
	});

	test("registers and retrieves command", () => {
		const handler: CommandHandler = async () => ok({ done: true });
		registry.register("test-cmd", handler);

		expect(registry.has("test-cmd")).toBe(true);
		expect(registry.get("test-cmd")).toBe(handler);
	});

	test("returns undefined for unknown command", () => {
		expect(registry.get("unknown")).toBeUndefined();
		expect(registry.has("unknown")).toBe(false);
	});

	test("lists all registered commands", () => {
		registry.register("cmd-a", async () => ok(null));
		registry.register("cmd-b", async () => ok(null));
		registry.register("cmd-c", async () => ok(null));

		const commands = registry.list();
		expect(commands).toContain("cmd-a");
		expect(commands).toContain("cmd-b");
		expect(commands).toContain("cmd-c");
		expect(commands).toHaveLength(3);
	});

	test("executes command handler", async () => {
		const handler: CommandHandler = async (args) => ok({ args });
		registry.register("echo", handler);

		const result = await registry.execute(
			"echo",
			["a", "b"],
			createTestContext(),
		);

		expect(result.success).toBe(true);
		expect(result.data).toEqual({ args: ["a", "b"] });
	});

	test("returns error for unknown command", async () => {
		const result = await registry.execute(
			"nonexistent",
			[],
			createTestContext(),
		);

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("UNKNOWN");
		expect(result.error?.message).toContain("Unknown command");
	});

	test("runs before hooks", async () => {
		const calls: string[] = [];

		registry.onBefore((name, args) => {
			calls.push(`before:${name}:${args.join(",")}`);
		});
		registry.register("test", async () => {
			calls.push("handler");
			return ok(null);
		});

		await registry.execute("test", ["x"], createTestContext());

		expect(calls).toEqual(["before:test:x", "handler"]);
	});

	test("runs after hooks", async () => {
		const calls: string[] = [];

		registry.onAfter((name, result) => {
			calls.push(`after:${name}:${result.success}`);
		});
		registry.register("test", async () => {
			calls.push("handler");
			return ok(null);
		});

		await registry.execute("test", [], createTestContext());

		expect(calls).toEqual(["handler", "after:test:true"]);
	});

	test("runs multiple hooks in order", async () => {
		const calls: string[] = [];

		registry.onBefore(() => {
			calls.push("before1");
		});
		registry.onBefore(() => {
			calls.push("before2");
		});
		registry.onAfter(() => {
			calls.push("after1");
		});
		registry.onAfter(() => {
			calls.push("after2");
		});
		registry.register("test", async () => {
			calls.push("handler");
			return ok(null);
		});

		await registry.execute("test", [], createTestContext());

		expect(calls).toEqual([
			"before1",
			"before2",
			"handler",
			"after1",
			"after2",
		]);
	});

	test("reset clears commands and hooks", async () => {
		const calls: string[] = [];

		registry.register("cmd", async () => ok(null));
		registry.onBefore(() => {
			calls.push("hook");
		});
		registry.reset();

		expect(registry.has("cmd")).toBe(false);

		// Register new command and verify hook doesn't run
		registry.register("new-cmd", async () => ok(null));
		await registry.execute("new-cmd", [], createTestContext());
		expect(calls).toHaveLength(0);
	});
});

describe("registerCommand convenience function", () => {
	beforeEach(() => {
		registry.reset();
	});

	test("registers command on global registry", () => {
		registerCommand("convenience-cmd", async () => ok({ test: true }));

		expect(registry.has("convenience-cmd")).toBe(true);
	});
});
