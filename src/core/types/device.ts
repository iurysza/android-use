/**
 * Device state as reported by ADB
 */
export type DeviceState =
  | "device" // Ready
  | "offline" // Not responding
  | "unauthorized" // USB debug not authorized
  | "no permissions" // Insufficient permissions
  | "bootloader" // In bootloader
  | "recovery" // In recovery mode
  | "sideload" // Sideload mode
  | "unknown";

/**
 * Device transport type
 */
export type DeviceTransport = "usb" | "wifi" | "unknown";

/**
 * Device info from `adb devices -l`
 */
export interface Device {
  serial: string;
  state: DeviceState;
  transport: DeviceTransport;
  product?: string; // ro.product.name
  model?: string; // ro.product.model
  device?: string; // ro.product.device
  transportId?: string;
}

/**
 * Screen dimensions
 */
export interface ScreenInfo {
  width: number;
  height: number;
  density?: number;
}
