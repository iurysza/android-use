import type { Device, DeviceState, DeviceTransport } from "../types/device.ts";

/**
 * Parse `adb devices -l` output into Device array
 *
 * Example output:
 * List of devices attached
 * emulator-5554          device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:1
 * 192.168.1.100:5555     device product:flame model:Pixel_4 device:flame transport_id:2
 * XXXXXX                 unauthorized
 */
export function parseDeviceList(output: string): Device[] {
	const lines = output.trim().split("\n");
	const devices: Device[] = [];

	for (const line of lines) {
		// Skip header and empty lines
		if (line.startsWith("List of devices") || line.trim() === "") {
			continue;
		}

		const device = parseDeviceLine(line);
		if (device) {
			devices.push(device);
		}
	}

	return devices;
}

/**
 * Parse a single device line
 */
export function parseDeviceLine(line: string): Device | null {
	const trimmed = line.trim();
	if (!trimmed) return null;

	// Split on whitespace, first part is serial, second is state
	const parts = trimmed.split(/\s+/);
	if (parts.length < 2) return null;

	const serial = parts[0];
	const state = parseDeviceState(parts[1]);
	if (!serial) return null;

	const device: Device = {
		serial,
		state,
		transport: inferTransport(serial),
	};

	// Parse additional properties (product:xxx model:xxx device:xxx transport_id:xxx)
	for (let i = 2; i < parts.length; i++) {
		const part = parts[i];
		if (!part) continue;

		const [key, value] = part.split(":");
		if (!key || !value) continue;

		switch (key) {
			case "product":
				device.product = value;
				break;
			case "model":
				device.model = value;
				break;
			case "device":
				device.device = value;
				break;
			case "transport_id":
				device.transportId = value;
				break;
		}
	}

	return device;
}

/**
 * Parse device state string
 * Note: "no permissions" appears as "no" in split output - caller handles full state
 */
export function parseDeviceState(state: string | undefined): DeviceState {
	if (!state) return "unknown";

	const normalized = state.toLowerCase();

	// Handle "no permissions" (may be split or complete)
	if (normalized === "no" || normalized.startsWith("no permissions")) {
		return "no permissions";
	}

	switch (normalized) {
		case "device":
			return "device";
		case "offline":
			return "offline";
		case "unauthorized":
			return "unauthorized";
		case "bootloader":
			return "bootloader";
		case "recovery":
			return "recovery";
		case "sideload":
			return "sideload";
		default:
			return "unknown";
	}
}

/**
 * Infer transport type from serial
 */
export function inferTransport(serial: string): DeviceTransport {
	// WiFi: contains colon and port (e.g., 192.168.1.100:5555)
	if (serial.includes(":") && /:\d+$/.test(serial)) {
		return "wifi";
	}
	// USB: emulator-xxxx or device serial
	if (serial.startsWith("emulator-") || /^[A-Z0-9]+$/i.test(serial)) {
		return "usb";
	}
	return "unknown";
}

/**
 * Find device by serial or return first device if serial is null
 */
export function findDevice(
	devices: Device[],
	serial: string | null,
): Device | null {
	if (devices.length === 0) {
		return null;
	}

	if (serial === null) {
		// Return first ready device, or first device if none ready
		const ready = devices.find((d) => d.state === "device");
		return ready ?? devices[0] ?? null;
	}

	return devices.find((d) => d.serial === serial) ?? null;
}

/**
 * Check if device is ready for commands
 */
export function isDeviceReady(device: Device): boolean {
	return device.state === "device";
}
