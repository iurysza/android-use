import { TapInputSchema } from "@core/contracts/inputs.ts";
import type { TapOutput } from "@core/contracts/outputs.ts";
import { ok, err } from "@core/types/result.ts";
import type { CommandResult } from "@core/types/result.ts";
import type { CommandContext } from "@shell/registry.ts";
import { registerCommand } from "@shell/registry.ts";

/**
 * tap command - tap at coordinates
 */
async function tap(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<TapOutput>> {
	// Parse args: x y [serial]
	const input = TapInputSchema.safeParse({
		x: args[0] ? Number(args[0]) : undefined,
		y: args[1] ? Number(args[1]) : undefined,
		serial: args[2] ?? null,
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { x, y, serial } = input.data;

	const result = await ctx.adb.exec(
		["shell", "input", "tap", String(x), String(y)],
		{
			timeoutMs: ctx.config.timeoutMs,
			signal: ctx.signal,
			serial,
		},
	);
	ctx.trace.recordCall(
		["shell", "input", "tap", String(x), String(y)],
		result.durationMs,
		result.exitCode,
	);

	if (result.exitCode !== 0) {
		return err("ADB_FAILED", result.stderr || "Tap failed", {
			exitCode: result.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	return ok(
		{ x, y },
		{
			message: `Tapped at (${x}, ${y})`,
			trace: ctx.trace.finish(),
		},
	);
}

registerCommand("tap", tap);

export { tap };
