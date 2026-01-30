import { InstallApkInputSchema } from "@core/contracts/inputs.ts";
import type { InstallApkOutput } from "@core/contracts/outputs.ts";
import { ok, err } from "@core/types/result.ts";
import type { CommandResult } from "@core/types/result.ts";
import type { CommandContext } from "@shell/registry.ts";
import { registerCommand } from "@shell/registry.ts";

/**
 * install-apk command - install APK file
 */
async function installApk(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<InstallApkOutput>> {
	const input = InstallApkInputSchema.safeParse({
		apkPath: args[0],
		replace: !args.includes("--no-replace"),
		downgrade: args.includes("--downgrade"),
		grantPermissions: args.includes("--grant"),
		serial:
			args.find((a) => a.includes(":") || /^[A-Z0-9]{6,}$/i.test(a)) ?? null,
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { apkPath, replace, downgrade, grantPermissions, serial } = input.data;

	// Check if file exists
	const file = Bun.file(apkPath);
	const exists = await file.exists();
	if (!exists) {
		return err("FILE_NOT_FOUND", `APK file not found: ${apkPath}`, {
			trace: ctx.trace.finish(),
		});
	}

	// Build install command
	const installArgs = ["install"];
	if (replace) installArgs.push("-r");
	if (downgrade) installArgs.push("-d");
	if (grantPermissions) installArgs.push("-g");
	installArgs.push(apkPath);

	const result = await ctx.adb.exec(installArgs, {
		timeoutMs: ctx.config.timeoutMs * 4, // APK install can be slow
		signal: ctx.signal,
		serial,
	});
	ctx.trace.recordCall(installArgs, result.durationMs, result.exitCode);

	if (result.exitCode !== 0 || result.stdout.includes("Failure")) {
		const failMatch = result.stdout.match(/Failure \[([^\]]+)\]/);
		const failReason = failMatch?.[1] ?? result.stderr ?? "Unknown error";
		return err("ADB_FAILED", `Install failed: ${failReason}`, {
			exitCode: result.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	// Extract package name from APK using aapt (if available) or parse success message
	let packageName = "unknown";
	const pkgMatch = result.stdout.match(/pkg:\s*name='([^']+)'/);
	if (pkgMatch?.[1]) {
		packageName = pkgMatch[1];
	} else {
		// Try to get from apk path
		const apkName = apkPath.split("/").pop()?.replace(".apk", "") ?? "unknown";
		packageName = apkName;
	}

	return ok(
		{
			packageName,
			versionName: undefined,
			wasReplaced: replace,
		},
		{
			message: `Installed ${apkPath}`,
			trace: ctx.trace.finish(),
		},
	);
}

registerCommand("install-apk", installApk);

export { installApk };
