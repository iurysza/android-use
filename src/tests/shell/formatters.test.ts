import { describe, expect, test } from "bun:test";
import { formatText, formatData } from "@shell/formatters/text.ts";
import { formatJson } from "@shell/formatters/json.ts";
import { ok, err } from "@core/types/result.ts";
import { createTraceBuilder } from "@core/types/trace.ts";

describe("formatText", () => {
	test("formats simple success result", () => {
		const result = ok({ count: 1 }, { message: "Done" });
		const output = formatText(result);

		expect(output).toContain("Done");
		expect(output).toContain("count:");
		expect(output).toContain("1");
	});

	test("formats nested objects", () => {
		const result = ok(
			{
				devices: [
					{ serial: "abc123", state: "device" },
					{ serial: "def456", state: "offline" },
				],
				count: 2,
			},
			{ message: "Found 2 device(s)" },
		);
		const output = formatText(result);

		expect(output).toContain("Found 2 device(s)");
		expect(output).toContain("abc123");
		expect(output).toContain("def456");
		expect(output).toContain("device");
		expect(output).toContain("offline");
		expect(output).not.toContain("[object Object]");
	});

	test("formats arrays", () => {
		const result = ok({ items: ["a", "b", "c"] }, { message: "List" });
		const output = formatText(result);

		expect(output).toContain("a");
		expect(output).toContain("b");
		expect(output).toContain("c");
		expect(output).not.toContain("[object Object]");
	});

	test("formats deeply nested objects", () => {
		const result = ok(
			{
				level1: {
					level2: {
						level3: "deep value",
					},
				},
			},
			{ message: "Nested" },
		);
		const output = formatText(result);

		expect(output).toContain("deep value");
		expect(output).not.toContain("[object Object]");
	});

	test("formats error result", () => {
		const result = err("ADB_FAILED", "Connection lost");
		const output = formatText(result);

		expect(output).toContain("ADB_FAILED");
		expect(output).toContain("Connection lost");
	});

	test("formats warnings", () => {
		const result = ok(
			{ text: "hello" },
			{ message: "Typed", warnings: ["Non-ASCII detected"] },
		);
		const output = formatText(result);

		expect(output).toContain("Non-ASCII detected");
	});

	test("handles null values", () => {
		const result = ok({ value: null }, { message: "Null test" });
		const output = formatText(result);

		expect(output).toContain("null");
		expect(output).not.toContain("[object Object]");
	});

	test("handles empty arrays", () => {
		const result = ok({ items: [] }, { message: "Empty" });
		const output = formatText(result);

		expect(output).toContain("[]");
	});

	test("handles empty objects", () => {
		const result = ok({ data: {} }, { message: "Empty obj" });
		const output = formatText(result);

		expect(output).toContain("{}");
	});
});

describe("formatData", () => {
	test("formats string directly", () => {
		expect(formatData("hello")).toBe("hello");
	});

	test("formats null/undefined as empty", () => {
		expect(formatData(null)).toBe("");
		expect(formatData(undefined)).toBe("");
	});

	test("formats nested objects", () => {
		const data = {
			devices: [{ serial: "abc" }],
		};
		const output = formatData(data);

		expect(output).toContain("abc");
		expect(output).not.toContain("[object Object]");
	});
});

describe("formatJson", () => {
	test("outputs valid JSON", () => {
		const trace = createTraceBuilder("test");
		const result = ok(
			{ devices: [{ serial: "abc123" }], count: 1 },
			{ message: "Found", trace: trace.finish() },
		);
		const output = formatJson(result);

		const parsed = JSON.parse(output);
		expect(parsed.success).toBe(true);
		expect(parsed.data.devices[0].serial).toBe("abc123");
	});

	test("includes trace in JSON output", () => {
		const trace = createTraceBuilder("test-cmd");
		trace.recordCall(["shell", "test"], 100, 0);
		const result = ok({ done: true }, { message: "OK", trace: trace.finish() });
		const output = formatJson(result);

		const parsed = JSON.parse(output);
		expect(parsed.trace.command).toBe("test-cmd");
		expect(parsed.trace.adbCalls.length).toBe(1);
	});
});
