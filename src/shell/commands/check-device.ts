import { CheckDeviceInputSchema } from "../../core/contracts/inputs.ts";
import type { CheckDeviceOutput } from "../../core/contracts/outputs.ts";
import {
	parseDeviceList,
	findDevice,
} from "../../core/domain/device-parser.ts";
import { ok, err } from "../../core/types/result.ts";
import type { CommandResult } from "../../core/types/result.ts";
import type { CommandContext } from "../registry.ts";
import { registerCommand } from "../registry.ts";

/**
 * check-device command - list/verify connected devices
 */
async function checkDevice(
	args: string[],
	ctx: CommandContext,
): Promise<CommandResult<CheckDeviceOutput>> {
	// Parse args: optional [serial]
	const input = CheckDeviceInputSchema.safeParse({
		serial: args[0] ?? null,
	});

	if (!input.success) {
		return err("INVALID_INPUT", input.error.message, {
			trace: ctx.trace.finish(),
		});
	}

	const { serial } = input.data;

	// Execute adb devices -l
	const startTime = Date.now();
	const result = await ctx.adb.exec(["devices", "-l"], {
		timeoutMs: ctx.config.timeoutMs,
		signal: ctx.signal,
	});
	ctx.trace.recordCall(
		["devices", "-l"],
		Date.now() - startTime,
		result.exitCode,
	);

	if (result.exitCode !== 0) {
		return err("ADB_FAILED", result.stderr || "Failed to list devices", {
			exitCode: result.exitCode,
			trace: ctx.trace.finish(),
		});
	}

	// Parse device list
	const devices = parseDeviceList(result.stdout);

	// If serial specified, verify device exists
	if (serial !== null) {
		const device = findDevice(devices, serial);
		if (!device) {
			return err("DEVICE_NOT_FOUND", `Device not found: ${serial}`, {
				trace: ctx.trace.finish(),
				metadata: { requestedSerial: serial },
			});
		}

		if (device.state === "offline") {
			return err("DEVICE_OFFLINE", `Device is offline: ${serial}`, {
				trace: ctx.trace.finish(),
			});
		}

		if (device.state === "unauthorized") {
			return err(
				"DEVICE_UNAUTHORIZED",
				`Device unauthorized: ${serial}. Please accept USB debugging prompt on device.`,
				{
					trace: ctx.trace.finish(),
				},
			);
		}
	}

	return ok(
		{
			devices: devices.map((d) => ({
				serial: d.serial,
				state: d.state,
				transport: d.transport,
				product: d.product,
				model: d.model,
				device: d.device,
				transportId: d.transportId,
			})),
			count: devices.length,
		},
		{
			message:
				devices.length > 0
					? `Found ${devices.length} device(s)`
					: "No devices connected",
			trace: ctx.trace.finish(),
		},
	);
}

// Register command
registerCommand("check-device", checkDevice);

export { checkDevice };
