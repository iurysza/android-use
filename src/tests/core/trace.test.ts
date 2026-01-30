import { describe, expect, test } from "bun:test";
import { createTraceBuilder } from "../../core/types/trace.ts";

describe("createTraceBuilder", () => {
	test("creates trace with command name", () => {
		const builder = createTraceBuilder("test-command");
		const trace = builder.finish();

		expect(trace.command).toBe("test-command");
	});

	test("records start and end times", () => {
		const before = Date.now();
		const builder = createTraceBuilder("cmd");
		const trace = builder.finish();
		const after = Date.now();

		expect(trace.startTimeMs).toBeGreaterThanOrEqual(before);
		expect(trace.endTimeMs).toBeLessThanOrEqual(after);
		expect(trace.endTimeMs).toBeGreaterThanOrEqual(trace.startTimeMs);
	});

	test("calculates duration", () => {
		const builder = createTraceBuilder("cmd");
		const trace = builder.finish();

		expect(trace.durationMs).toBe(trace.endTimeMs - trace.startTimeMs);
	});

	test("records ADB calls", () => {
		const builder = createTraceBuilder("cmd");

		builder.recordCall(["devices", "-l"], 50, 0);
		builder.recordCall(["shell", "input", "tap"], 100, 0);

		const trace = builder.finish();

		expect(trace.adbCalls).toHaveLength(2);
		expect(trace.adbCalls[0]).toEqual({
			args: ["devices", "-l"],
			durationMs: 50,
			exitCode: 0,
			error: undefined,
		});
		expect(trace.adbCalls[1]?.args).toEqual(["shell", "input", "tap"]);
	});

	test("records ADB call errors", () => {
		const builder = createTraceBuilder("cmd");

		builder.recordCall(["shell", "bad"], 10, 1, "Command failed");

		const trace = builder.finish();

		expect(trace.adbCalls[0]?.exitCode).toBe(1);
		expect(trace.adbCalls[0]?.error).toBe("Command failed");
	});

	test("records errors separately", () => {
		const builder = createTraceBuilder("cmd");

		builder.recordError("Something went wrong");
		builder.recordError("Another error");

		const trace = builder.finish();

		expect(trace.errors).toHaveLength(2);
		expect(trace.errors).toContain("Something went wrong");
		expect(trace.errors).toContain("Another error");
	});

	test("returns empty arrays when no calls or errors", () => {
		const builder = createTraceBuilder("cmd");
		const trace = builder.finish();

		expect(trace.adbCalls).toEqual([]);
		expect(trace.errors).toEqual([]);
	});
});
