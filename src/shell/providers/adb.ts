/**
 * ADB execution options
 */
export interface ExecOptions {
	/** Timeout in milliseconds */
	timeoutMs: number;
	/** Abort signal for cancellation */
	signal?: AbortSignal | undefined;
	/** Target device serial (prepends -s flag) */
	serial?: string | null | undefined;
}

/**
 * Raw ADB execution result
 */
export interface AdbResult {
	/** Exit code (0 = success) */
	exitCode: number;
	/** stdout content */
	stdout: string;
	/** stderr content */
	stderr: string;
	/** Execution duration in ms */
	durationMs: number;
}

/**
 * ADB provider interface - abstraction for ADB execution
 */
export interface AdbProvider {
	/**
	 * Execute an ADB command
	 * @param args - Command arguments (without 'adb' prefix)
	 * @param options - Execution options
	 * @returns Promise resolving to AdbResult
	 * @throws On timeout or cancellation
	 */
	exec(args: readonly string[], options: ExecOptions): Promise<AdbResult>;
}

/**
 * Check if result indicates success
 */
export function isAdbSuccess(result: AdbResult): boolean {
	return result.exitCode === 0;
}

/**
 * Build full args array with serial if provided
 */
export function buildAdbArgs(
	args: readonly string[],
	serial?: string | null,
): string[] {
	if (serial) {
		return ["-s", serial, ...args];
	}
	return [...args];
}
