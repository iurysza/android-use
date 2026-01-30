import { GetScreenInputSchema } from "@core/contracts/inputs.ts";
import type { GetScreenOutput } from "@core/contracts/outputs.ts";
import { ok, err } from "@core/types/result.ts";
import type { CommandResult } from "@core/types/result.ts";
import type { CommandContext } from "@shell/registry.ts";
import { registerCommand } from "@shell/registry.ts";

/**
 * get-screen command - dump UI hierarchy as XML
 */
async function getScreen(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<GetScreenOutput>> {
	const input = GetScreenInputSchema.safeParse({
		serial: args[0] ?? null,
		includeInvisible: args.includes("--include-invisible"),
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { serial } = input.data;
	const execOpts = {
		timeoutMs: ctx.config.timeoutMs,
		signal: ctx.signal,
		serial,
	};

	// Dump UI hierarchy to file on device
	const dumpPath = "/sdcard/window_dump.xml";
	const dumpResult = await ctx.adb.exec(
		["shell", "uiautomator", "dump", dumpPath],
		execOpts,
	);
	ctx.trace.recordCall(
		["shell", "uiautomator", "dump"],
		dumpResult.durationMs,
		dumpResult.exitCode,
	);

	if (dumpResult.exitCode !== 0) {
		return err("ADB_FAILED", dumpResult.stderr || "UI dump failed", {
			exitCode: dumpResult.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	// Read the dump file
	const catResult = await ctx.adb.exec(["shell", "cat", dumpPath], execOpts);
	ctx.trace.recordCall(
		["shell", "cat", dumpPath],
		catResult.durationMs,
		catResult.exitCode,
	);

	if (catResult.exitCode !== 0) {
		return err("ADB_FAILED", catResult.stderr || "Failed to read UI dump", {
			exitCode: catResult.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	const xml = catResult.stdout;

	// Clean up dump file
	await ctx.adb.exec(["shell", "rm", dumpPath], execOpts);

	return ok(
		{
			xml,
			byteSize: new TextEncoder().encode(xml).length,
		},
		{
			message: `UI hierarchy dumped (${xml.length} chars)`,
			trace: ctx.trace.finish(),
		},
	);
}

registerCommand("get-screen", getScreen);

export { getScreen };
