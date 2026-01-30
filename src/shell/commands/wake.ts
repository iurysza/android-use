import { WakeInputSchema } from "../../core/contracts/inputs.ts";
import type { WakeOutput } from "../../core/contracts/outputs.ts";
import { KEYCODES } from "../../core/types/keys.ts";
import { ok, err } from "../../core/types/result.ts";
import type { CommandResult } from "../../core/types/result.ts";
import type { CommandContext } from "../registry.ts";
import { registerCommand } from "../registry.ts";

/**
 * wake command - wake device and dismiss lock screen
 */
async function wake(
  args: string[],
  ctx: CommandContext
): Promise<CommandResult<WakeOutput>> {
  const input = WakeInputSchema.safeParse({
    serial: args[0] ?? null,
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

  // Check if screen is on via dumpsys power
  let wasAsleep = false;
  const powerCheck = await ctx.adb.exec(
    ["shell", "dumpsys", "power", "|", "grep", "'Display Power'"],
    execOpts
  );
  ctx.trace.recordCall(["shell", "dumpsys", "power"], powerCheck.durationMs, powerCheck.exitCode);

  // Parse power state
  wasAsleep = !powerCheck.stdout.includes("state=ON");

  // Send WAKEUP keycode
  const wakeResult = await ctx.adb.exec(
    ["shell", "input", "keyevent", String(KEYCODES.WAKEUP)],
    execOpts
  );
  ctx.trace.recordCall(["shell", "input", "keyevent", "WAKEUP"], wakeResult.durationMs, wakeResult.exitCode);

  if (wakeResult.exitCode !== 0) {
    return err("ADB_FAILED", wakeResult.stderr || "Failed to wake device", {
      exitCode: wakeResult.exitCode,
      trace: ctx.trace.finish(),
    });
  }

  // Dismiss lock screen with MENU keycode (swipe up alternative)
  const menuResult = await ctx.adb.exec(
    ["shell", "input", "keyevent", String(KEYCODES.MENU)],
    execOpts
  );
  ctx.trace.recordCall(["shell", "input", "keyevent", "MENU"], menuResult.durationMs, menuResult.exitCode);

  // Small delay then swipe up to dismiss any remaining lock
  await new Promise((r) => setTimeout(r, 300));

  const swipeResult = await ctx.adb.exec(
    ["shell", "input", "swipe", "540", "1800", "540", "800", "300"],
    execOpts
  );
  ctx.trace.recordCall(["shell", "input", "swipe"], swipeResult.durationMs, swipeResult.exitCode);

  return ok(
    {
      wasAsleep,
      isAwake: true,
    },
    {
      message: wasAsleep ? "Device woken up" : "Device was already awake",
      trace: ctx.trace.finish(),
    }
  );
}

registerCommand("wake", wake);

export { wake };
