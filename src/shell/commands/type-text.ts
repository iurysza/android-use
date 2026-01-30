import { TypeTextInputSchema } from "../../core/contracts/inputs.ts";
import type { TypeTextOutput } from "../../core/contracts/outputs.ts";
import { splitTextForInput } from "../../core/domain/text-escape.ts";
import { ok, err } from "../../core/types/result.ts";
import type { CommandResult } from "../../core/types/result.ts";
import type { CommandContext } from "../registry.ts";
import { registerCommand } from "../registry.ts";

/**
 * type-text command - type text with proper escaping
 */
async function typeText(
  args: string[],
  ctx: CommandContext
): Promise<CommandResult<TypeTextOutput>> {
  // Parse args: text [serial]
  // Text might contain spaces, so join all args except last if it looks like serial
  let textArg = args.join(" ");
  let serial: string | null = null;

  // Check if last arg looks like a device serial
  const lastArg = args[args.length - 1];
  if (lastArg && (lastArg.includes(":") || /^[A-Z0-9]{6,}$/i.test(lastArg) || lastArg.startsWith("emulator-"))) {
    serial = lastArg;
    textArg = args.slice(0, -1).join(" ");
  }

  const input = TypeTextInputSchema.safeParse({
    text: textArg,
    serial,
  });

  if (!input.success) {
    return err("INVALID_INPUT", input.error.message, {
      trace: ctx.trace.finish(),
    });
  }

  const { text } = input.data;
  serial = input.data.serial;

  // Split text into chunks to avoid command length limits
  const chunks = splitTextForInput(text);
  const warnings: string[] = [];

  for (const chunk of chunks) {
    const result = await ctx.adb.exec(
      ["shell", "input", "text", chunk],
      {
        timeoutMs: ctx.config.timeoutMs,
        signal: ctx.signal,
        serial,
      }
    );
    ctx.trace.recordCall(
      ["shell", "input", "text", `"${chunk.slice(0, 20)}..."`],
      result.durationMs,
      result.exitCode
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
    warnings.push(`${nonAsciiCount} non-ASCII character(s) may not have been typed correctly`);
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
    }
  );
}

registerCommand("type-text", typeText);

export { typeText };
