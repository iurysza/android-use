import { describe, expect, test } from "bun:test";
import {
	parseDeviceList,
	parseDeviceLine,
	parseDeviceState,
	inferTransport,
	findDevice,
	isDeviceReady,
} from "../../core/domain/device-parser.ts";
import type { Device } from "../../core/types/device.ts";

describe("parseDeviceList", () => {
	test("parses multiple devices", () => {
		const output = `List of devices attached
emulator-5554	device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:1
192.168.1.100:5555	device product:flame model:Pixel_4 device:flame transport_id:2
`;
		const devices = parseDeviceList(output);

		expect(devices).toHaveLength(2);
		expect(devices[0]?.serial).toBe("emulator-5554");
		expect(devices[0]?.state).toBe("device");
		expect(devices[0]?.transport).toBe("usb");
		expect(devices[0]?.model).toBe("sdk_gphone64_arm64");

		expect(devices[1]?.serial).toBe("192.168.1.100:5555");
		expect(devices[1]?.state).toBe("device");
		expect(devices[1]?.transport).toBe("wifi");
		expect(devices[1]?.model).toBe("Pixel_4");
	});

	test("parses empty device list", () => {
		const output = `List of devices attached

`;
		const devices = parseDeviceList(output);
		expect(devices).toHaveLength(0);
	});

	test("parses unauthorized device", () => {
		const output = `List of devices attached
XXXXXX	unauthorized
`;
		const devices = parseDeviceList(output);

		expect(devices).toHaveLength(1);
		expect(devices[0]?.serial).toBe("XXXXXX");
		expect(devices[0]?.state).toBe("unauthorized");
	});

	test("parses offline device", () => {
		const output = `List of devices attached
emulator-5554	offline
`;
		const devices = parseDeviceList(output);

		expect(devices).toHaveLength(1);
		expect(devices[0]?.state).toBe("offline");
	});

	test("handles mixed device states", () => {
		const output = `List of devices attached
emulator-5554	device product:sdk model:Pixel device:emu transport_id:1
ABC123	unauthorized
192.168.1.50:5555	offline
`;
		const devices = parseDeviceList(output);

		expect(devices).toHaveLength(3);
		expect(devices[0]?.state).toBe("device");
		expect(devices[1]?.state).toBe("unauthorized");
		expect(devices[2]?.state).toBe("offline");
	});
});

describe("parseDeviceLine", () => {
	test("returns null for empty line", () => {
		expect(parseDeviceLine("")).toBeNull();
		expect(parseDeviceLine("   ")).toBeNull();
	});

	test("returns null for incomplete line", () => {
		expect(parseDeviceLine("emulator-5554")).toBeNull();
	});

	test("parses device with all properties", () => {
		const line =
			"emulator-5554	device product:sdk_gphone64 model:Pixel_4 device:emu64a transport_id:1";
		const device = parseDeviceLine(line);

		expect(device).not.toBeNull();
		expect(device?.serial).toBe("emulator-5554");
		expect(device?.state).toBe("device");
		expect(device?.product).toBe("sdk_gphone64");
		expect(device?.model).toBe("Pixel_4");
		expect(device?.device).toBe("emu64a");
		expect(device?.transportId).toBe("1");
	});

	test("parses device with minimal properties", () => {
		const line = "ABC123	device";
		const device = parseDeviceLine(line);

		expect(device).not.toBeNull();
		expect(device?.serial).toBe("ABC123");
		expect(device?.state).toBe("device");
		expect(device?.product).toBeUndefined();
	});
});

describe("parseDeviceState", () => {
	test("parses known states", () => {
		expect(parseDeviceState("device")).toBe("device");
		expect(parseDeviceState("offline")).toBe("offline");
		expect(parseDeviceState("unauthorized")).toBe("unauthorized");
		expect(parseDeviceState("bootloader")).toBe("bootloader");
		expect(parseDeviceState("recovery")).toBe("recovery");
		expect(parseDeviceState("sideload")).toBe("sideload");
	});

	test("handles case insensitivity", () => {
		expect(parseDeviceState("DEVICE")).toBe("device");
		expect(parseDeviceState("Offline")).toBe("offline");
	});

	test("returns unknown for unrecognized states", () => {
		expect(parseDeviceState("something")).toBe("unknown");
		expect(parseDeviceState(undefined)).toBe("unknown");
	});

	test("handles 'no permissions' split case", () => {
		expect(parseDeviceState("no")).toBe("no permissions");
	});
});

describe("inferTransport", () => {
	test("detects WiFi transport", () => {
		expect(inferTransport("192.168.1.100:5555")).toBe("wifi");
		expect(inferTransport("10.0.0.1:5555")).toBe("wifi");
		expect(inferTransport("localhost:5555")).toBe("wifi");
	});

	test("detects USB transport for emulators", () => {
		expect(inferTransport("emulator-5554")).toBe("usb");
		expect(inferTransport("emulator-5556")).toBe("usb");
	});

	test("detects USB transport for device serials", () => {
		expect(inferTransport("ABC123DEF")).toBe("usb");
		expect(inferTransport("R5CT123ABCD")).toBe("usb");
	});

	test("returns unknown for ambiguous serials", () => {
		expect(inferTransport("my-device")).toBe("unknown");
	});
});

describe("findDevice", () => {
	const devices: Device[] = [
		{ serial: "emulator-5554", state: "device", transport: "usb" },
		{ serial: "ABC123", state: "unauthorized", transport: "usb" },
		{ serial: "192.168.1.100:5555", state: "device", transport: "wifi" },
	];

	test("returns null for empty list", () => {
		expect(findDevice([], null)).toBeNull();
		expect(findDevice([], "emulator-5554")).toBeNull();
	});

	test("finds device by serial", () => {
		const device = findDevice(devices, "ABC123");
		expect(device?.serial).toBe("ABC123");
	});

	test("returns null for non-existent serial", () => {
		expect(findDevice(devices, "nonexistent")).toBeNull();
	});

	test("returns first ready device when serial is null", () => {
		const device = findDevice(devices, null);
		expect(device?.serial).toBe("emulator-5554");
		expect(device?.state).toBe("device");
	});

	test("returns first device if none ready", () => {
		const offlineDevices: Device[] = [
			{ serial: "A", state: "offline", transport: "usb" },
			{ serial: "B", state: "unauthorized", transport: "usb" },
		];
		const device = findDevice(offlineDevices, null);
		expect(device?.serial).toBe("A");
	});
});

describe("isDeviceReady", () => {
	test("returns true for device state", () => {
		expect(
			isDeviceReady({ serial: "X", state: "device", transport: "usb" }),
		).toBe(true);
	});

	test("returns false for non-device states", () => {
		expect(
			isDeviceReady({ serial: "X", state: "offline", transport: "usb" }),
		).toBe(false);
		expect(
			isDeviceReady({ serial: "X", state: "unauthorized", transport: "usb" }),
		).toBe(false);
		expect(
			isDeviceReady({ serial: "X", state: "unknown", transport: "usb" }),
		).toBe(false);
	});
});
