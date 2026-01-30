# Android-Use Skill: Bun Project Plan
## Functional Core / Imperative Shell Architecture

**Version:** 1.0  
**Date:** 2026-01-30  
**Author:** Planning Agent  
**Project:** New project from scratch (TypeScript + Bun)

---

## Executive Summary

**Goal:** Build a new Bun/TypeScript CLI + library for Android device control via ADB.  
**Scope:** 10 commands (same set as original scripts, but implemented fresh).  
**Architecture:** Functional Core / Imperative Shell with strong boundaries.  
**Quality:** Zod contracts, rich results, structured output, extensible hooks.  
**Estimated Effort:** 3-4 days.

### Commands (v1)

- `check-device` - list/verify connected devices
- `wake` - wake device and dismiss lock
- `get-screen` - dump UI XML hierarchy
- `tap` - tap coordinates
- `type-text` - type text with escaping
- `swipe` - swipe gestures
- `key` - press keycodes
- `screenshot` - capture screen
- `launch-app` - launch apps by name/package
- `install-apk` - install APKs

---

## Project Goals

- Simple CLI for common tasks (`bun run tap 100 200`)
- Programmatic API for automation/agents
- Strong input/output contracts using Zod
- Structured results with `--json`
- Lightweight observability for debugging
- Stable, testable core logic

## Non-Goals

- UI/GUI
- Device farm or cloud orchestration
- Non-ADB backends (future extension)

---

## Architectural Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPERATIVE SHELL                          │
│  (Side Effects: ADB, File I/O, Console, Process Exit)       │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ CLI Entry  │  │  Commands  │  │ ADB Driver │           │
│  │  (I/O)     │→ │  (Orchestr)│→ │  (Exec)    │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│         ↓              ↓                                     │
│    Validate       Call Core                                 │
│         ↓              ↓                                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     FUNCTIONAL CORE                          │
│        (Pure Logic: No I/O, No Side Effects)                │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │Coordinates │  │Text Escape │  │Device Parse│           │
│  │   (Pure)   │  │   (Pure)   │  │   (Pure)   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Keycodes  │  │ App Lookup │  │ Validation │           │
│  │   (Pure)   │  │   (Pure)   │  │   (Pure)   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**Principle:** Validate at the boundary, trust the interior.

---

## Quality Principles (from browser-use, adapted)

### 1) Multiple Abstraction Levels

- **Level 1 (CLI):** `bun run tap 100 200`
- **Level 2 (Command API):** `import { tap } from "android-use"`
- **Level 3 (Primitives):** `adb.exec(...)`, `core/*` pure functions

### 2) Type-safe Contracts (Zod)

All inputs/outputs/configs validated by Zod schemas.

```typescript
import { z } from "zod";

export const TapInputSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  serial: z.string().min(1).nullable(),
});

export const SkillConfigSchema = z.object({
  adbPath: z.string().min(1).default("adb"),
  timeoutMs: z.number().int().positive().default(15000),
  maxRetries: z.number().int().min(0).default(1),
  outputFormat: z.enum(["text", "json"]).default("text"),
  verbose: z.boolean().default(false),
});
```

### 3) Rich Return Types Over Primitives

```typescript
export type CommandResult<T = unknown> = {
  success: boolean;
  exitCode: number;
  message?: string;
  data?: T;
  error?: { code: ErrorCode; message: string };  // Typed error codes
  warnings?: string[];
  trace?: ExecutionTrace;
  metadata?: Record<string, string | number | boolean>;
};

// Standard error codes
type ErrorCode = 
  | "INVALID_INPUT"    // Zod validation failed
  | "ADB_FAILED"       // ADB command failed
  | "TIMEOUT"          // Operation timed out
  | "CANCELLED"        // Aborted via AbortSignal
  | "DEVICE_NOT_FOUND" // No device with serial
  | "UNKNOWN";
```

### 4) Configuration Over Hard-Coding

- `adbPath`, `timeoutMs`, `maxRetries`
- `defaultSerial`
- `outputFormat` (`text` | `json`)
- `verbose`

### 5) Provider Abstraction

```typescript
export interface ExecOptions {
  timeoutMs: number;
  signal?: AbortSignal;  // Cancellation support for TUI/interactive use
}

export interface AdbProvider {
  exec(args: readonly string[], options: ExecOptions): Promise<ADBResult>;
}
```

- `LocalAdbProvider` (default) - kills subprocess on abort
- `MockAdbProvider` (tests)

**Cancellation pattern:**

```typescript
const controller = new AbortController();
onCancel(() => controller.abort());  // TUI cancel button, Ctrl+C, etc.

const result = await tap({ x: 100, y: 200 }, { signal: controller.signal });
// Returns CommandResult.error("CANCELLED", "Operation cancelled") on abort
```

### 6) Extension Points as First-Class

- `onBeforeCommand`, `onAfterCommand`
- `registerCommand(name, handler)`
- `registerFormatter("text" | "json", formatterFn)`

### 7) Observability from Day One (Lightweight)

```typescript
export type ExecutionTrace = {
  command: string;
  startTimeMs: number;
  endTimeMs: number;
  adbCalls: { args: string[]; durationMs: number }[];
  errors: string[];
};
```

### 8) Fail-Fast with Graceful Degradation

- Validate inputs at entry
- Timeouts on all ADB calls
- Retry only retryable errors
- Return partial results where possible

### 9) Developer Experience > Internal Elegance

- Minimal required args
- Actionable errors with guidance
- `--help` examples
- Defaults for common cases

### 10) Structured Output for Agent Reasoning

- `--json` outputs `CommandResult` schema
- Stable, machine-readable results

---

## Directory Structure

```
android-use/
├── package.json
├── tsconfig.json
├── bunfig.toml (optional)
│
├── src/
│   ├── index.ts                    # CLI entry
│   ├── shell/                      # IMPERATIVE SHELL
│   │   ├── cli.ts                  # Argument parsing, dispatch
│   │   ├── providers/
│   │   │   ├── adb.ts              # AdbProvider interface
│   │   │   ├── adb-local.ts        # Local ADB implementation
│   │   │   └── adb-mock.ts         # Test provider
│   │   ├── formatters/
│   │   │   ├── text.ts             # Human output
│   │   │   └── json.ts             # JSON output
│   │   ├── observability/
│   │   │   └── trace.ts            # ExecutionTrace builder
│   │   ├── registry.ts             # Command registry + hooks
│   │   └── commands/
│   │       ├── check-device.ts
│   │       ├── wake.ts
│   │       ├── get-screen.ts
│   │       ├── tap.ts
│   │       ├── type-text.ts
│   │       ├── swipe.ts
│   │       ├── key.ts
│   │       ├── screenshot.ts
│   │       ├── launch-app.ts
│   │       └── install-apk.ts
│   ├── core/                       # FUNCTIONAL CORE
│   │   ├── contracts/              # Zod schemas
│   │   │   ├── inputs.ts
│   │   │   ├── outputs.ts
│   │   │   └── config.ts
│   │   ├── domain/                 # Pure business logic
│   │   │   ├── coordinates.ts
│   │   │   ├── text-escape.ts
│   │   │   ├── keycodes.ts
│   │   │   ├── device-parser.ts
│   │   │   ├── app-resolver.ts
│   │   │   └── screen-dimensions.ts
│   │   └── types/
│   │       ├── device.ts
│   │       ├── coordinates.ts
│   │       ├── keys.ts
│   │       ├── app.ts
│   │       ├── result.ts
│   │       └── trace.ts
│   └── tests/
│       ├── core/
│       └── shell/
│
├── README.md
├── SKILL.md
└── MIGRATION_PLAN.md               # This document
```

---

## Command Structure Pattern

```typescript
// src/shell/commands/[command].ts

import { [CommandInputSchema] } from "../../core/contracts/inputs";
import { [coreFunction] } from "../../core/domain/[module]";
import type { CommandContext } from "../registry";
import { CommandResult } from "../../core/types/result";

export async function [command](rawArgs: string[], ctx: CommandContext) {
  const parsed = [CommandInputSchema].safeParse(parseArgs(rawArgs));
  if (!parsed.success) {
    return CommandResult.error("INVALID_INPUT", parsed.error.message, ctx.trace.finish());
  }

  const input = parsed.data;
  const commandArgs = [coreFunction](input);

  try {
    const adbResult = await ctx.adb.exec(commandArgs, { timeoutMs: ctx.config.timeoutMs });
    return CommandResult.ok({
      message: "Success",
      data: adbResult,
      trace: ctx.trace.finish(),
    });
  } catch (error) {
    return CommandResult.error("ADB_FAILED", error.message, ctx.trace.finish());
  }
}
```

---

## CLI UX

Common flags:

- `-s, --serial <id>`
- `--adb-path <path>`
- `--timeout <ms>`
- `--retries <n>`
- `--json`
- `--verbose`
- `--help`, `--version`

---

## Testing Strategy

- **Core tests:** Pure logic (no mocks)
- **Schema tests:** Zod input/output validation
- **Shell tests:** Mocked ADB provider
- **CLI tests:** `--json` output contract

---

## Implementation Steps

1. **Project setup**
   - `bun init`, strict `tsconfig.json`

2. **Define core types**
   - `src/core/types/*.ts`

3. **Add Zod contracts**
   - `src/core/contracts/{inputs,outputs,config}.ts`

4. **Add CommandResult + ExecutionTrace**
   - `src/core/types/result.ts`, `src/core/types/trace.ts`

5. **Implement ADB provider abstraction**
   - `src/shell/providers/adb.ts`, `adb-local.ts`, `adb-mock.ts`

6. **Add formatters + CLI output**
   - `src/shell/formatters/text.ts`, `json.ts`

7. **Build registry + hooks**
   - `src/shell/registry.ts`

8. **Implement commands (start with tap)**
   - Create command pattern, then replicate for others

9. **Add CLI router**
   - Parse flags, pass `CommandContext`

10. **Write tests**
    - Core, schema, shell, CLI JSON

11. **Docs**
    - README, SKILL, usage examples

---

## Risks & Mitigations

- **ADB output variability:** parse defensively, test on multiple devices
- **Text escaping differences:** comprehensive tests for special chars
- **Device state edge cases:** handle unauthorized/offline with actionable errors

---

## Success Criteria

- All 10 commands implemented and tested
- Zod schemas for inputs/outputs/configs
- Commands return `CommandResult`
- `--json` output stable and validated
- Lightweight execution trace attached
- CLI DX: clear errors and help

---

## Pre-Ship Checklist

- [ ] 3 abstraction levels (CLI, command API, primitives)
- [ ] Zod schemas for all inputs/outputs/configs
- [ ] Commands return `CommandResult` (no primitives)
- [ ] Configurable timeouts, retries, output format
- [ ] Provider abstraction (local ADB + mock)
- [ ] Extension points (hooks/registry/formatters)
- [ ] Lightweight execution trace on every result
- [ ] Fail-fast validation + graceful degradation
- [ ] `--json` structured output supported
- [ ] Actionable error messages + examples
- [ ] CLI `--help` and docs updated

---

## Appendix: Bun Features

```typescript
import { $ } from "bun";

const result = await $`adb devices`.text();
await Bun.write("/tmp/output.xml", xmlContent);
const file = Bun.file("/tmp/screenshot.png");
const serial = Bun.env.ANDROID_SERIAL;
```
