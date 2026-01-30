import type { CommandResult } from "../../core/types/result.ts";

/**
 * ANSI color codes (basic, works in most terminals)
 */
const COLORS = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
} as const;

/**
 * Check if colors should be used
 */
function useColors(): boolean {
	// Respect NO_COLOR standard
	// biome-ignore lint/complexity/useLiteralKeys: TS requires bracket notation for index signatures
	if (Bun.env["NO_COLOR"] !== undefined) return false;
	// Check if stdout is TTY
	return process.stdout.isTTY ?? false;
}

/**
 * Apply color if enabled
 */
function color(text: string, code: keyof typeof COLORS): string {
	if (!useColors()) return text;
	return `${COLORS[code]}${text}${COLORS.reset}`;
}

/**
 * Format success message
 */
function formatSuccess(message: string): string {
	return color(`✓ ${message}`, "green");
}

/**
 * Format error message
 */
function formatError(code: string, message: string): string {
	return color(`✗ [${code}] ${message}`, "red");
}

/**
 * Format warning message
 */
function formatWarning(message: string): string {
	return color(`⚠ ${message}`, "yellow");
}

/**
 * Format key-value pair
 */
function formatKV(key: string, value: unknown): string {
	const keyStr = color(`${key}:`, "dim");
	return `  ${keyStr} ${String(value)}`;
}

/**
 * Format CommandResult as human-readable text
 */
export function formatText<T>(result: CommandResult<T>): string {
	const lines: string[] = [];

	if (result.success) {
		// Success case
		const msg = result.message ?? "Success";
		lines.push(formatSuccess(msg));

		// Format data if present
		if (result.data !== undefined) {
			if (typeof result.data === "object" && result.data !== null) {
				for (const [key, value] of Object.entries(result.data)) {
					lines.push(formatKV(key, value));
				}
			} else {
				lines.push(`  ${String(result.data)}`);
			}
		}
	} else {
		// Error case
		const err = result.error;
		if (err) {
			lines.push(formatError(err.code, err.message));
		} else {
			lines.push(formatError("UNKNOWN", "Unknown error"));
		}
	}

	// Warnings
	if (result.warnings && result.warnings.length > 0) {
		for (const warn of result.warnings) {
			lines.push(formatWarning(warn));
		}
	}

	return lines.join("\n");
}

/**
 * Format data object as simple text (for specific output types)
 */
export function formatData(data: unknown): string {
	if (data === null || data === undefined) {
		return "";
	}

	if (typeof data === "string") {
		return data;
	}

	if (typeof data === "object") {
		const lines: string[] = [];
		for (const [key, value] of Object.entries(data)) {
			lines.push(`${key}: ${String(value)}`);
		}
		return lines.join("\n");
	}

	return String(data);
}
