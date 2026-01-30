import type { ExecutionTrace } from "./trace.ts";

/**
 * Standard error codes
 */
export type ErrorCode =
	| "INVALID_INPUT" // Zod validation failed
	| "ADB_FAILED" // ADB command failed
	| "TIMEOUT" // Operation timed out
	| "CANCELLED" // Aborted via AbortSignal
	| "DEVICE_NOT_FOUND" // No device with serial
	| "DEVICE_OFFLINE" // Device not responding
	| "DEVICE_UNAUTHORIZED" // USB debug not authorized
	| "FILE_NOT_FOUND" // APK or file not found
	| "PARSE_ERROR" // Failed to parse ADB output
	| "UNKNOWN";

/**
 * Structured error info
 */
export interface ResultError {
	code: ErrorCode;
	message: string;
	cause?: unknown;
}

/**
 * Command execution result
 */
export interface CommandResult<T = unknown> {
	success: boolean;
	exitCode: number;
	message?: string | undefined;
	data?: T | undefined;
	error?: ResultError | undefined;
	warnings?: string[] | undefined;
	trace?: ExecutionTrace | undefined;
	metadata?: Record<string, string | number | boolean> | undefined;
}

/**
 * Create a success result
 */
export function ok<T>(
	data: T,
	options?: {
		message?: string | undefined;
		warnings?: string[] | undefined;
		trace?: ExecutionTrace | undefined;
		metadata?: Record<string, string | number | boolean> | undefined;
	},
): CommandResult<T> {
	const result: CommandResult<T> = {
		success: true,
		exitCode: 0,
		data,
	};
	if (options?.message !== undefined) result.message = options.message;
	if (options?.warnings !== undefined) result.warnings = options.warnings;
	if (options?.trace !== undefined) result.trace = options.trace;
	if (options?.metadata !== undefined) result.metadata = options.metadata;
	return result;
}

/**
 * Create a failure result
 */
export function err<T = never>(
	code: ErrorCode,
	message: string,
	options?: {
		exitCode?: number | undefined;
		cause?: unknown;
		warnings?: string[] | undefined;
		trace?: ExecutionTrace | undefined;
		metadata?: Record<string, string | number | boolean> | undefined;
	},
): CommandResult<T> {
	const result: CommandResult<T> = {
		success: false,
		exitCode: options?.exitCode ?? 1,
		error: {
			code,
			message,
			cause: options?.cause,
		},
	};
	if (options?.warnings !== undefined) result.warnings = options.warnings;
	if (options?.trace !== undefined) result.trace = options.trace;
	if (options?.metadata !== undefined) result.metadata = options.metadata;
	return result;
}

/**
 * Check if result is success
 */
export function isOk<T>(
	result: CommandResult<T>,
): result is CommandResult<T> & { success: true; data: T } {
	return result.success;
}

/**
 * Check if result is failure
 */
export function isErr<T>(
	result: CommandResult<T>,
): result is CommandResult<T> & { success: false; error: ResultError } {
	return !result.success;
}

/**
 * Map success data
 */
export function map<T, U>(
	result: CommandResult<T>,
	fn: (data: T) => U,
): CommandResult<U> {
	if (isOk(result)) {
		const opts: {
			message?: string | undefined;
			warnings?: string[] | undefined;
			trace?: ExecutionTrace | undefined;
			metadata?: Record<string, string | number | boolean> | undefined;
		} = {};
		if (result.message !== undefined) opts.message = result.message;
		if (result.warnings !== undefined) opts.warnings = result.warnings;
		if (result.trace !== undefined) opts.trace = result.trace;
		if (result.metadata !== undefined) opts.metadata = result.metadata;
		return ok(fn(result.data), opts);
	}
	// Error case - just retype since data is not present
	return {
		success: result.success,
		exitCode: result.exitCode,
		error: result.error,
		warnings: result.warnings,
		trace: result.trace,
		metadata: result.metadata,
	};
}
