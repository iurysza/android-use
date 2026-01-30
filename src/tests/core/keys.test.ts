import { describe, expect, test } from "bun:test";
import { KEYCODES, resolveKeycode, isKeyName } from "../../core/types/keys.ts";

describe("KEYCODES", () => {
	test("contains navigation keys", () => {
		expect(KEYCODES.HOME).toBe(3);
		expect(KEYCODES.BACK).toBe(4);
		expect(KEYCODES.MENU).toBe(82);
		expect(KEYCODES.APP_SWITCH).toBe(187);
	});

	test("contains power and volume keys", () => {
		expect(KEYCODES.POWER).toBe(26);
		expect(KEYCODES.VOLUME_UP).toBe(24);
		expect(KEYCODES.VOLUME_DOWN).toBe(25);
	});

	test("contains d-pad keys", () => {
		expect(KEYCODES.DPAD_UP).toBe(19);
		expect(KEYCODES.DPAD_DOWN).toBe(20);
		expect(KEYCODES.DPAD_LEFT).toBe(21);
		expect(KEYCODES.DPAD_RIGHT).toBe(22);
		expect(KEYCODES.DPAD_CENTER).toBe(23);
	});

	test("contains action keys", () => {
		expect(KEYCODES.ENTER).toBe(66);
		expect(KEYCODES.TAB).toBe(61);
		expect(KEYCODES.SPACE).toBe(62);
		expect(KEYCODES.DEL).toBe(67);
	});
});

describe("resolveKeycode", () => {
	test("returns number input unchanged", () => {
		expect(resolveKeycode(42)).toBe(42);
		expect(resolveKeycode(3)).toBe(3);
	});

	test("resolves key names to codes", () => {
		expect(resolveKeycode("HOME")).toBe(3);
		expect(resolveKeycode("BACK")).toBe(4);
		expect(resolveKeycode("ENTER")).toBe(66);
	});

	test("throws for unknown key name", () => {
		expect(() => resolveKeycode("UNKNOWN_KEY" as "HOME")).toThrow(
			"Unknown key name",
		);
	});
});

describe("isKeyName", () => {
	test("returns true for valid key names", () => {
		expect(isKeyName("HOME")).toBe(true);
		expect(isKeyName("BACK")).toBe(true);
		expect(isKeyName("ENTER")).toBe(true);
		expect(isKeyName("VOLUME_UP")).toBe(true);
	});

	test("returns false for invalid key names", () => {
		expect(isKeyName("INVALID")).toBe(false);
		expect(isKeyName("home")).toBe(false); // case sensitive
		expect(isKeyName("")).toBe(false);
	});
});
