import type { AdbProvider, AdbResult, ExecOptions } from "./adb.ts";
import { buildAdbArgs } from "./adb.ts";

/**
 * Local ADB provider using Bun shell
 */
export class LocalAdbProvider implements AdbProvider {
	private readonly adbPath: string;

	constructor(adbPath = "adb") {
		this.adbPath = adbPath;
	}

	async exec(
		args: readonly string[],
		options: ExecOptions,
	): Promise<AdbResult> {
		const startTime = Date.now();
		const fullArgs = buildAdbArgs(args, options.serial);

		try {
			// Build command array
			const cmd = [this.adbPath, ...fullArgs];

			// Create subprocess with timeout
			const proc = Bun.spawn(cmd, {
				stdout: "pipe",
				stderr: "pipe",
			});

			// Handle abort signal
			if (options.signal) {
				options.signal.addEventListener(
					"abort",
					() => {
						proc.kill();
					},
					{ once: true },
				);
			}

			// Setup timeout
			const timeoutId = setTimeout(() => {
				proc.kill();
			}, options.timeoutMs);

			try {
				// Wait for completion
				const exitCode = await proc.exited;

				// Read output
				const stdout = await new Response(proc.stdout).text();
				const stderr = await new Response(proc.stderr).text();

				const durationMs = Date.now() - startTime;

				// Check if aborted
				if (options.signal?.aborted) {
					return {
						exitCode: -1,
						stdout: "",
						stderr: "Operation cancelled",
						durationMs,
					};
				}

				return {
					exitCode,
					stdout,
					stderr,
					durationMs,
				};
			} finally {
				clearTimeout(timeoutId);
			}
		} catch (error) {
			const durationMs = Date.now() - startTime;

			// Check for timeout (process killed)
			if (options.signal?.aborted) {
				return {
					exitCode: -1,
					stdout: "",
					stderr: "Operation cancelled",
					durationMs,
				};
			}

			return {
				exitCode: -1,
				stdout: "",
				stderr: error instanceof Error ? error.message : "Unknown error",
				durationMs,
			};
		}
	}
}

/**
 * Create a local ADB provider instance
 */
export function createLocalAdbProvider(adbPath = "adb"): AdbProvider {
	return new LocalAdbProvider(adbPath);
}
