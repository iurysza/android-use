import { describe, expect, test } from "bun:test";
import { ok, err, isOk, isErr, map } from "@core/types/result.ts";
import type { CommandResult } from "@core/types/result.ts";

describe("ok", () => {
	test("creates success result with data", () => {
		const result = ok({ value: 42 });

		expect(result.success).toBe(true);
		expect(result.exitCode).toBe(0);
		expect(result.data).toEqual({ value: 42 });
		expect(result.error).toBeUndefined();
	});

	test("includes optional message", () => {
		const result = ok("data", { message: "Operation successful" });

		expect(result.message).toBe("Operation successful");
	});

	test("includes optional warnings", () => {
		const result = ok("data", { warnings: ["Warning 1", "Warning 2"] });

		expect(result.warnings).toEqual(["Warning 1", "Warning 2"]);
	});

	test("includes optional metadata", () => {
		const result = ok("data", { metadata: { duration: 100, cached: true } });

		expect(result.metadata).toEqual({ duration: 100, cached: true });
	});

	test("excludes undefined optional fields", () => {
		const result = ok("data");

		expect("message" in result).toBe(false);
		expect("warnings" in result).toBe(false);
		expect("metadata" in result).toBe(false);
	});
});

describe("err", () => {
	test("creates failure result with error", () => {
		const result = err("ADB_FAILED", "Command failed");

		expect(result.success).toBe(false);
		expect(result.exitCode).toBe(1);
		expect(result.error?.code).toBe("ADB_FAILED");
		expect(result.error?.message).toBe("Command failed");
		expect(result.data).toBeUndefined();
	});

	test("allows custom exit code", () => {
		const result = err("TIMEOUT", "Timed out", { exitCode: 124 });

		expect(result.exitCode).toBe(124);
	});

	test("includes cause", () => {
		const cause = new Error("Original error");
		const result = err("UNKNOWN", "Wrapped error", { cause });

		expect(result.error?.cause).toBe(cause);
	});

	test("includes optional fields", () => {
		const result = err("INVALID_INPUT", "Bad input", {
			warnings: ["Check format"],
			metadata: { field: "x" },
		});

		expect(result.warnings).toEqual(["Check format"]);
		expect(result.metadata).toEqual({ field: "x" });
	});
});

describe("isOk", () => {
	test("returns true for success result", () => {
		const result = ok({ value: 1 });
		expect(isOk(result)).toBe(true);
	});

	test("returns false for failure result", () => {
		const result = err("ADB_FAILED", "Failed");
		expect(isOk(result)).toBe(false);
	});
});

describe("isErr", () => {
	test("returns true for failure result", () => {
		const result = err("ADB_FAILED", "Failed");
		expect(isErr(result)).toBe(true);
	});

	test("returns false for success result", () => {
		const result = ok({ value: 1 });
		expect(isErr(result)).toBe(false);
	});
});

describe("map", () => {
	test("transforms success data", () => {
		const result = ok(5);
		const mapped = map(result, (x) => x * 2);

		expect(isOk(mapped)).toBe(true);
		expect(mapped.data).toBe(10);
	});

	test("preserves optional fields on success", () => {
		const result = ok(5, {
			message: "ok",
			warnings: ["w"],
			metadata: { k: "v" },
		});
		const mapped = map(result, (x) => x * 2);

		expect(mapped.message).toBe("ok");
		expect(mapped.warnings).toEqual(["w"]);
		expect(mapped.metadata).toEqual({ k: "v" });
	});

	test("passes through error result unchanged", () => {
		const result: CommandResult<number> = err("INVALID_INPUT", "Bad");
		const mapped = map(result, (x) => x * 2);

		expect(isErr(mapped)).toBe(true);
		expect(mapped.error?.code).toBe("INVALID_INPUT");
	});

	test("preserves error fields", () => {
		const result: CommandResult<number> = err("ADB_FAILED", "Failed", {
			exitCode: 2,
			warnings: ["w"],
		});
		const mapped = map(result, (x) => x * 2);

		expect(mapped.exitCode).toBe(2);
		expect(mapped.warnings).toEqual(["w"]);
	});
});
