import { LaunchAppInputSchema } from "../../core/contracts/inputs.ts";
import type { LaunchAppOutput } from "../../core/contracts/outputs.ts";
import { ok, err } from "../../core/types/result.ts";
import type { CommandResult } from "../../core/types/result.ts";
import type { CommandContext } from "../registry.ts";
import { registerCommand } from "../registry.ts";

/**
 * launch-app command - launch app by package name
 */
async function launchApp(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<LaunchAppOutput>> {
	const input = LaunchAppInputSchema.safeParse({
		app: args[0],
		activity: args.find((a) => a.startsWith(".") || a.includes("Activity")),
		wait: !args.includes("--no-wait"),
		clearData: args.includes("--clear"),
		serial:
			args.find((a) => a.includes(":") || /^[A-Z0-9]{6,}$/i.test(a)) ?? null,
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { app, activity, wait, clearData, serial } = input.data;
	const execOpts = {
		timeoutMs: ctx.config.timeoutMs,
		signal: ctx.signal,
		serial,
	};

	// Clear data if requested
	if (clearData) {
		const clearResult = await ctx.adb.exec(
			["shell", "pm", "clear", app],
			execOpts,
		);
		ctx.trace.recordCall(
			["shell", "pm", "clear", app],
			clearResult.durationMs,
			clearResult.exitCode,
		);
		// Don't fail on clear error, app might not exist yet
	}

	// Build launch command
	const launchArgs = ["shell", "am", "start"];
	if (wait) {
		launchArgs.push("-W");
	}

	if (activity) {
		// Launch specific activity
		launchArgs.push("-n", `${app}/${activity}`);
	} else {
		// Launch via monkey (most reliable for package-only launch)
		const monkeyResult = await ctx.adb.exec(
			[
				"shell",
				"monkey",
				"-p",
				app,
				"-c",
				"android.intent.category.LAUNCHER",
				"1",
			],
			execOpts,
		);
		ctx.trace.recordCall(
			["shell", "monkey", "-p", app],
			monkeyResult.durationMs,
			monkeyResult.exitCode,
		);

		if (
			monkeyResult.exitCode !== 0 ||
			monkeyResult.stdout.includes("No activities found")
		) {
			return err(
				"ADB_FAILED",
				`Failed to launch ${app}: app not found or no launcher activity`,
				{
					exitCode: monkeyResult.exitCode,
					trace: ctx.trace.finish(),
				},
			);
		}

		return ok(
			{
				packageName: app,
				activity: undefined,
				launchTime: undefined,
			},
			{
				message: `Launched ${app}`,
				trace: ctx.trace.finish(),
			},
		);
	}

	// Launch with am start
	const launchResult = await ctx.adb.exec(launchArgs, execOpts);
	ctx.trace.recordCall(
		launchArgs,
		launchResult.durationMs,
		launchResult.exitCode,
	);

	if (launchResult.exitCode !== 0) {
		return err("ADB_FAILED", launchResult.stderr || `Failed to launch ${app}`, {
			exitCode: launchResult.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	// Parse launch time from output if available
	let launchTime: number | undefined;
	const timeMatch = launchResult.stdout.match(/TotalTime:\s*(\d+)/);
	if (timeMatch?.[1]) {
		launchTime = Number(timeMatch[1]);
	}

	return ok(
		{
			packageName: app,
			activity,
			launchTime,
		},
		{
			message: launchTime
				? `Launched ${app} in ${launchTime}ms`
				: `Launched ${app}`,
			trace: ctx.trace.finish(),
		},
	);
}

registerCommand("launch-app", launchApp);

export { launchApp };
