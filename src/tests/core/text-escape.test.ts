import { describe, expect, test } from "bun:test";
import {
	escapeForAdbInput,
	isAsciiPrintable,
	escapeShellArg,
	splitTextForInput,
} from "@core/domain/text-escape.ts";

describe("escapeForAdbInput", () => {
	test("escapes spaces to %s", () => {
		expect(escapeForAdbInput("hello world")).toBe("hello%sworld");
		expect(escapeForAdbInput("a b c")).toBe("a%sb%sc");
	});

	test("escapes special shell characters", () => {
		expect(escapeForAdbInput("'")).toBe("\\'");
		expect(escapeForAdbInput('"')).toBe('\\"');
		expect(escapeForAdbInput("`")).toBe("\\`");
		expect(escapeForAdbInput("\\")).toBe("\\\\");
		expect(escapeForAdbInput("$")).toBe("\\$");
		expect(escapeForAdbInput("&")).toBe("\\&");
		expect(escapeForAdbInput(";")).toBe("\\;");
		expect(escapeForAdbInput("|")).toBe("\\|");
		expect(escapeForAdbInput("<")).toBe("\\<");
		expect(escapeForAdbInput(">")).toBe("\\>");
	});

	test("escapes brackets and parens", () => {
		expect(escapeForAdbInput("(")).toBe("\\(");
		expect(escapeForAdbInput(")")).toBe("\\)");
		expect(escapeForAdbInput("[")).toBe("\\[");
		expect(escapeForAdbInput("]")).toBe("\\]");
		expect(escapeForAdbInput("{")).toBe("\\{");
		expect(escapeForAdbInput("}")).toBe("\\}");
	});

	test("escapes other special chars", () => {
		expect(escapeForAdbInput("!")).toBe("\\!");
		expect(escapeForAdbInput("*")).toBe("\\*");
		expect(escapeForAdbInput("?")).toBe("\\?");
		expect(escapeForAdbInput("~")).toBe("\\~");
		expect(escapeForAdbInput("#")).toBe("\\#");
	});

	test("removes newlines", () => {
		expect(escapeForAdbInput("line1\nline2")).toBe("line1line2");
	});

	test("converts tabs to spaces", () => {
		expect(escapeForAdbInput("a\tb")).toBe("a%s%s%s%sb");
	});

	test("passes through normal text", () => {
		expect(escapeForAdbInput("hello")).toBe("hello");
		expect(escapeForAdbInput("test123")).toBe("test123");
		expect(escapeForAdbInput("ABC")).toBe("ABC");
	});

	test("filters non-ASCII chars", () => {
		expect(escapeForAdbInput("hello😀world")).toBe("helloworld");
		expect(escapeForAdbInput("café")).toBe("caf");
	});

	test("handles mixed content", () => {
		expect(escapeForAdbInput("Hello World!")).toBe("Hello%sWorld\\!");
		expect(escapeForAdbInput("$HOME/path")).toBe("\\$HOME/path");
	});
});

describe("isAsciiPrintable", () => {
	test("returns true for printable ASCII", () => {
		expect(isAsciiPrintable("hello")).toBe(true);
		expect(isAsciiPrintable("Hello World 123!")).toBe(true);
		expect(isAsciiPrintable("~")).toBe(true);
	});

	test("returns false for non-printable", () => {
		expect(isAsciiPrintable("hello\nworld")).toBe(false);
		expect(isAsciiPrintable("tab\there")).toBe(false);
	});

	test("returns false for non-ASCII", () => {
		expect(isAsciiPrintable("café")).toBe(false);
		expect(isAsciiPrintable("hello😀")).toBe(false);
	});

	test("returns true for empty string", () => {
		expect(isAsciiPrintable("")).toBe(true);
	});
});

describe("escapeShellArg", () => {
	test("wraps in single quotes", () => {
		expect(escapeShellArg("hello")).toBe("'hello'");
	});

	test("escapes embedded single quotes", () => {
		expect(escapeShellArg("it's")).toBe("'it'\\''s'");
		expect(escapeShellArg("a'b'c")).toBe("'a'\\''b'\\''c'");
	});

	test("handles special characters safely", () => {
		expect(escapeShellArg("$HOME")).toBe("'$HOME'");
		expect(escapeShellArg("a b c")).toBe("'a b c'");
	});
});

describe("splitTextForInput", () => {
	test("returns single chunk for short text", () => {
		const chunks = splitTextForInput("hello");
		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toBe("hello");
	});

	test("splits long text into chunks", () => {
		const longText = "a".repeat(150);
		const chunks = splitTextForInput(longText, 100);
		expect(chunks.length).toBeGreaterThan(1);
		expect(chunks.every((c) => c.length <= 100)).toBe(true);
	});

	test("accounts for escape sequence length", () => {
		const text = "a b c d e f"; // spaces become %s (2 chars)
		const chunks = splitTextForInput(text, 10);
		expect(chunks.every((c) => c.length <= 10)).toBe(true);
	});

	test("returns empty array for empty string", () => {
		const chunks = splitTextForInput("");
		expect(chunks).toHaveLength(0);
	});

	test("handles text with only special chars", () => {
		const chunks = splitTextForInput("   ", 10);
		expect(chunks.join("")).toBe("%s%s%s");
	});
});
