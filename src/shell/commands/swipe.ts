import { SwipeInputSchema } from "@core/contracts/inputs.ts";
import type { SwipeOutput } from "@core/contracts/outputs.ts";
import { ok, err } from "@core/types/result.ts";
import type { CommandResult } from "@core/types/result.ts";
import type { CommandContext } from "@shell/registry.ts";
import { registerCommand } from "@shell/registry.ts";

/**
 * swipe command - perform swipe gesture
 */
async function swipe(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<SwipeOutput>> {
	// Parse args: startX startY endX endY [durationMs] [serial]
	const input = SwipeInputSchema.safeParse({
		startX: args[0] ? Number(args[0]) : undefined,
		startY: args[1] ? Number(args[1]) : undefined,
		endX: args[2] ? Number(args[2]) : undefined,
		endY: args[3] ? Number(args[3]) : undefined,
		durationMs: args[4] ? Number(args[4]) : undefined,
		serial: args[5] ?? null,
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { startX, startY, endX, endY, durationMs, serial } = input.data;

	const result = await ctx.adb.exec(
		[
			"shell",
			"input",
			"swipe",
			String(startX),
			String(startY),
			String(endX),
			String(endY),
			String(durationMs),
		],
		{
			timeoutMs: ctx.config.timeoutMs,
			signal: ctx.signal,
			serial,
		},
	);
	ctx.trace.recordCall(
		[
			"shell",
			"input",
			"swipe",
			String(startX),
			String(startY),
			String(endX),
			String(endY),
		],
		result.durationMs,
		result.exitCode,
	);

	if (result.exitCode !== 0) {
		return err("ADB_FAILED", result.stderr || "Swipe failed", {
			exitCode: result.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	return ok(
		{ startX, startY, endX, endY, durationMs },
		{
			message: `Swiped from (${startX},${startY}) to (${endX},${endY})`,
			trace: ctx.trace.finish(),
		},
	);
}

registerCommand("swipe", swipe);

export { swipe };
