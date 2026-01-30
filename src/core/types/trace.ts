/**
 * Single ADB call record
 */
export interface AdbCall {
  args: readonly string[];
  durationMs: number;
  exitCode?: number | undefined;
  error?: string | undefined;
}

/**
 * Lightweight execution trace for observability
 */
export interface ExecutionTrace {
  command: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  adbCalls: AdbCall[];
  errors: string[];
}

/**
 * Trace builder for accumulating calls during execution
 */
export interface TraceBuilder {
  /**
   * Record an ADB call
   */
  recordCall(args: readonly string[], durationMs: number, exitCode?: number, error?: string): void;

  /**
   * Record an error
   */
  recordError(error: string): void;

  /**
   * Finish and return the trace
   */
  finish(): ExecutionTrace;
}

/**
 * Create a new trace builder
 */
export function createTraceBuilder(command: string): TraceBuilder {
  const startTimeMs = Date.now();
  const adbCalls: AdbCall[] = [];
  const errors: string[] = [];

  return {
    recordCall(args, durationMs, exitCode, error) {
      adbCalls.push({ args, durationMs, exitCode, error });
    },

    recordError(error) {
      errors.push(error);
    },

    finish() {
      const endTimeMs = Date.now();
      return {
        command,
        startTimeMs,
        endTimeMs,
        durationMs: endTimeMs - startTimeMs,
        adbCalls,
        errors,
      };
    },
  };
}
