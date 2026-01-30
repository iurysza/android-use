import type { AdbProvider, AdbResult, ExecOptions } from "./adb.ts";
import { buildAdbArgs } from "./adb.ts";

/**
 * Mock response configuration
 */
export interface MockResponse {
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  /** Simulate delay in ms */
  delay?: number;
  /** Throw error instead of returning result */
  error?: Error;
}

/**
 * Mock ADB provider for testing
 */
export class MockAdbProvider implements AdbProvider {
  private responses: Map<string, MockResponse> = new Map();
  private defaultResponse: MockResponse = {
    exitCode: 0,
    stdout: "",
    stderr: "",
  };
  public calls: Array<{ args: string[]; options: ExecOptions }> = [];

  /**
   * Set response for specific command pattern
   * @param pattern - Command args joined by space (e.g., "devices -l")
   * @param response - Mock response to return
   */
  setResponse(pattern: string, response: MockResponse): this {
    this.responses.set(pattern, response);
    return this;
  }

  /**
   * Set default response for unmatched commands
   */
  setDefaultResponse(response: MockResponse): this {
    this.defaultResponse = response;
    return this;
  }

  /**
   * Clear all mock responses and call history
   */
  reset(): this {
    this.responses.clear();
    this.calls = [];
    this.defaultResponse = { exitCode: 0, stdout: "", stderr: "" };
    return this;
  }

  /**
   * Get call history
   */
  getCalls(): Array<{ args: string[]; options: ExecOptions }> {
    return [...this.calls];
  }

  /**
   * Check if a command was called
   */
  wasCalled(pattern: string): boolean {
    return this.calls.some((call) => call.args.join(" ").includes(pattern));
  }

  async exec(
    args: readonly string[],
    options: ExecOptions,
  ): Promise<AdbResult> {
    const startTime = Date.now();
    const fullArgs = buildAdbArgs(args, options.serial);
    const pattern = fullArgs.join(" ");

    // Record call
    this.calls.push({ args: [...fullArgs], options });

    // Find matching response
    let response = this.defaultResponse;
    for (const [key, value] of this.responses) {
      if (pattern.includes(key) || key === pattern) {
        response = value;
        break;
      }
    }

    // Simulate delay
    if (response.delay) {
      await new Promise((resolve) => setTimeout(resolve, response.delay));
    }

    // Check abort
    if (options.signal?.aborted) {
      return {
        exitCode: -1,
        stdout: "",
        stderr: "Operation cancelled",
        durationMs: Date.now() - startTime,
      };
    }

    // Throw if error configured
    if (response.error) {
      throw response.error;
    }

    return {
      exitCode: response.exitCode ?? 0,
      stdout: response.stdout ?? "",
      stderr: response.stderr ?? "",
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Create a mock ADB provider instance
 */
export function createMockAdbProvider(): MockAdbProvider {
  return new MockAdbProvider();
}

// ============================================================================
// Preset mock responses for common commands
// ============================================================================

/**
 * Mock device list response
 */
export const MOCK_DEVICES_RESPONSE = `List of devices attached
emulator-5554	device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:1
192.168.1.100:5555	device product:flame model:Pixel_4 device:flame transport_id:2
`;

/**
 * Mock empty devices response
 */
export const MOCK_NO_DEVICES_RESPONSE = `List of devices attached

`;

/**
 * Mock UI dump XML
 */
export const MOCK_UI_DUMP = `<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node index="0" text="" resource-id="" class="android.widget.FrameLayout" bounds="[0,0][1080,2340]">
    <node index="0" text="Hello World" resource-id="com.example:id/text" class="android.widget.TextView" bounds="[100,200][500,300]" />
  </node>
</hierarchy>`;
