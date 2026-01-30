import { ScreenshotInputSchema } from "@core/contracts/inputs.ts";
import type { ScreenshotOutput } from "@core/contracts/outputs.ts";
import { ok, err } from "@core/types/result.ts";
import type { CommandResult } from "@core/types/result.ts";
import type { CommandContext } from "@shell/registry.ts";
import { registerCommand } from "@shell/registry.ts";

/**
 * screenshot command - capture device screen
 */
async function screenshot(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<ScreenshotOutput>> {
	const input = ScreenshotInputSchema.safeParse({
		output: args[0] ?? "./screenshot.png",
		serial: args[1] ?? null,
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { output, serial } = input.data;
	const execOpts = {
		timeoutMs: ctx.config.timeoutMs,
		signal: ctx.signal,
		serial,
	};

	// Capture screenshot on device
	const devicePath = "/sdcard/screenshot.png";
	const capResult = await ctx.adb.exec(
		["shell", "screencap", "-p", devicePath],
		execOpts,
	);
	ctx.trace.recordCall(
		["shell", "screencap"],
		capResult.durationMs,
		capResult.exitCode,
	);

	if (capResult.exitCode !== 0) {
		return err("ADB_FAILED", capResult.stderr || "Screenshot capture failed", {
			exitCode: capResult.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	// Pull file to local path
	const pullResult = await ctx.adb.exec(["pull", devicePath, output], execOpts);
	ctx.trace.recordCall(
		["pull", devicePath, output],
		pullResult.durationMs,
		pullResult.exitCode,
	);

	if (pullResult.exitCode !== 0) {
		return err("ADB_FAILED", pullResult.stderr || "Failed to pull screenshot", {
			exitCode: pullResult.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	// Clean up device file
	await ctx.adb.exec(["shell", "rm", devicePath], execOpts);

	// Get file size
	let byteSize = 0;
	try {
		const file = Bun.file(output);
		byteSize = file.size;
	} catch (e) {
		if (ctx.config.verbose) {
			console.warn(`[screenshot] Failed to get file size: ${e}`);
		}
	}

	return ok(
		{
			path: output,
			byteSize,
		},
		{
			message: `Screenshot saved to ${output}`,
			trace: ctx.trace.finish(),
		},
	);
}

registerCommand("screenshot", screenshot);

export { screenshot };
