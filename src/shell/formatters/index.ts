import type { CommandResult } from "@core/types/result.ts";
import { formatText } from "./text.ts";
import { formatJson } from "./json.ts";

export * from "./text.ts";
export * from "./json.ts";

/**
 * Output format type
 */
export type OutputFormat = "text" | "json";

/**
 * Formatter function signature
 */
export type Formatter = <T>(result: CommandResult<T>) => string;

/**
 * Formatter registry
 */
const formatters: Map<OutputFormat, Formatter> = new Map([
	["text", formatText],
	["json", formatJson],
]);

/**
 * Get formatter for output format
 */
export function getFormatter(format: OutputFormat): Formatter {
	const formatter = formatters.get(format);
	if (!formatter) {
		throw new Error(`Unknown output format: ${format}`);
	}
	return formatter;
}

/**
 * Register a custom formatter
 */
export function registerFormatter(format: string, formatter: Formatter): void {
	formatters.set(format as OutputFormat, formatter);
}

/**
 * Format result using specified format
 */
export function format<T>(
	result: CommandResult<T>,
	outputFormat: OutputFormat,
): string {
	return getFormatter(outputFormat)(result);
}
