import type { CommandResult } from "@core/types/result.ts";

/**
 * Format CommandResult as JSON string
 * Stable, machine-readable output for --json flag
 */
export function formatJson<T>(result: CommandResult<T>): string {
	return JSON.stringify(result, null, 2);
}

/**
 * Format CommandResult as compact JSON (single line)
 */
export function formatJsonCompact<T>(result: CommandResult<T>): string {
	return JSON.stringify(result);
}

/**
 * Format only the data portion as JSON
 */
export function formatDataJson<T>(data: T): string {
	return JSON.stringify(data, null, 2);
}
