import { TypeTextInputSchema } from "@core/contracts/inputs.ts";
import type { TypeTextOutput } from "@core/contracts/outputs.ts";
import { splitTextForInput } from "@core/domain/text-escape.ts";
import { ok, err } from "@core/types/result.ts";
import type { CommandResult } from "@core/types/result.ts";
import type { CommandContext } from "@shell/registry.ts";
import { registerCommand } from "@shell/registry.ts";

/**
 * type-text command - type text with proper escaping
 */
async function typeText(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<TypeTextOutput>> {
	// Parse args: all args are the text to type
	// Serial is passed via --serial flag (ctx.config.defaultSerial) not inline
	const textArg = args.join(" ");

	const input = TypeTextInputSchema.safeParse({
		text: textArg,
		serial: ctx.config.defaultSerial,
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { text, serial } = input.data;

	// Split text into chunks to avoid command length limits
	const chunks = splitTextForInput(text);
	const warnings: string[] = [];

	for (const chunk of chunks) {
		const result = await ctx.adb.exec(["shell", "input", "text", chunk], {
			timeoutMs: ctx.config.timeoutMs,
			signal: ctx.signal,
			serial,
		});
		ctx.trace.recordCall(
			["shell", "input", "text", `"${chunk.slice(0, 20)}..."`],
			result.durationMs,
			result.exitCode,
		);

		if (result.exitCode !== 0) {
			return err("ADB_FAILED", result.stderr || "Type text failed", {
				exitCode: result.exitCode,
				trace: ctx.trace.finish(),
				warnings: warnings.length > 0 ? warnings : undefined,
			});
		}
	}

	// Check for non-ASCII characters that may not have been typed
	const nonAsciiCount = [...text].filter((c) => c.charCodeAt(0) > 126).length;
	if (nonAsciiCount > 0) {
		warnings.push(
			`${nonAsciiCount} non-ASCII character(s) may not have been typed correctly`,
		);
	}

	return ok(
		{
			text,
			length: text.length,
		},
		{
			message: `Typed ${text.length} character(s)`,
			trace: ctx.trace.finish(),
			warnings: warnings.length > 0 ? warnings : undefined,
		},
	);
}

registerCommand("type-text", typeText);

export { typeText };
