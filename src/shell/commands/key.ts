import { KeyInputSchema } from "@core/contracts/inputs.ts";
import type { KeyOutput } from "@core/contracts/outputs.ts";
import { resolveKeycode, isKeyName, KEYCODES } from "@core/types/keys.ts";
import { ok, err } from "@core/types/result.ts";
import type { CommandResult } from "@core/types/result.ts";
import type { CommandContext } from "@shell/registry.ts";
import { registerCommand } from "@shell/registry.ts";

/**
 * key command - press a keycode
 */
async function key(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<KeyOutput>> {
	// Parse args: key [serial]
	const keyArg = args[0];
	const serialArg = args[1] ?? null;

	// Determine if keyArg is a number or name
	let keyInput: string | number;
	if (keyArg && /^\d+$/.test(keyArg)) {
		keyInput = Number(keyArg);
	} else {
		keyInput = keyArg ?? "";
	}

	const input = KeyInputSchema.safeParse({
		key: keyInput,
		serial: serialArg,
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { key: keyValue, serial } = input.data;

	// Resolve keycode
	let keycode: number;
	let keyName: string | undefined;

	if (typeof keyValue === "number") {
		keycode = keyValue;
		// Find name for this code
		for (const [name, code] of Object.entries(KEYCODES)) {
			if (code === keyValue) {
				keyName = name;
				break;
			}
		}
	} else {
		const upperKey = keyValue.toUpperCase();
		if (!isKeyName(upperKey)) {
			return err(
				"INVALID_INPUT",
				`Unknown key name: ${keyValue}. Valid names: ${Object.keys(KEYCODES).join(", ")}`,
				{ trace: ctx.trace.finish() },
			);
		}
		keycode = resolveKeycode(upperKey);
		keyName = upperKey;
	}

	const result = await ctx.adb.exec(
		["shell", "input", "keyevent", String(keycode)],
		{
			timeoutMs: ctx.config.timeoutMs,
			signal: ctx.signal,
			serial,
		},
	);
	ctx.trace.recordCall(
		["shell", "input", "keyevent", String(keycode)],
		result.durationMs,
		result.exitCode,
	);

	if (result.exitCode !== 0) {
		return err("ADB_FAILED", result.stderr || "Key press failed", {
			exitCode: result.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	return ok(
		{ keycode, keyName },
		{
			message: keyName
				? `Pressed ${keyName} (${keycode})`
				: `Pressed keycode ${keycode}`,
			trace: ctx.trace.finish(),
		},
	);
}

registerCommand("key", key);

export { key };
