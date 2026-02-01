# android-use Semantic Map

## Project Overview

**android-use** is a CLI tool and library for controlling Android devices via ADB (Android Debug Bridge). It enables automation of taps, swipes, text input, screenshots, app launching, and UI interactions.

- **Version**: 0.1.0
- **License**: MIT
- **Author**: Iury Souza
- **Repository**: https://github.com/iurysza/android-use
- **Runtime**: Bun (>=1.3.8)

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/` | Main source code |
| `src/core/` | Domain logic, types, contracts, parsers |
| `src/shell/` | CLI layer, commands, providers, formatters |
| `src/tests/` | Unit tests mirroring source structure |
| `examples/` | Usage tutorials and workflow guides |
| `dist/` | Compiled output (build target) |
| `.ai-artifacts/` | AI-generated documentation (this file) |

## Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│  CLI Entry (src/index.ts)           │
├─────────────────────────────────────┤
│  Shell Layer (src/shell/)           │
│  - cli.ts       (argument parsing)  │
│  - registry.ts  (command routing)   │
│  - commands/    (command handlers)  │
│  - providers/   (ADB abstraction)   │
│  - formatters/  (output formatting) │
├─────────────────────────────────────┤
│  Core Layer (src/core/)             │
│  - contracts/   (Zod schemas)       │
│  - types/       (TypeScript types)  │
│  - domain/      (business logic)    │
│  - parsers/     (XML parsing)       │
└─────────────────────────────────────┘
```

### Design Patterns

- **Command Pattern**: Commands register via `registry.ts`, enabling hooks and unified execution
- **Provider Pattern**: `AdbProvider` interface abstracts ADB execution (local shell, mock for testing)
- **Result Pattern**: `CommandResult<T>` with `ok()`/`err()` helpers for type-safe error handling
- **Schema Validation**: Zod schemas for all inputs/outputs in `contracts/`
- **Trace Pattern**: Execution tracing for observability and debugging

## Entry Points

| File | Purpose |
|------|---------|
| `src/index.ts` | CLI entry point - parses args and delegates to `runCli()` |
| `src/shell/cli.ts` | Main CLI logic: arg parsing, command routing, output formatting |
| `dist/index.js` | Compiled CLI binary (package.json `bin` entry) |

## Core Modules

### Commands (`src/shell/commands/`)

All commands follow the same pattern: validate input with Zod → execute ADB → return `CommandResult`.

| Command | File | Purpose |
|---------|------|---------|
| `check-device` | `check-device.ts` | List connected devices with status |
| `wake` | `wake.ts` | Wake device and dismiss lock screen |
| `get-screen` | `get-screen.ts` | Dump UI hierarchy (compact JSON or full XML) |
| `tap` | `tap.ts` | Tap at screen coordinates |
| `type-text` | `type-text.ts` | Type text with shell escaping |
| `swipe` | `swipe.ts` | Swipe gesture between coordinates |
| `key` | `key.ts` | Press key by name or code |
| `screenshot` | `screenshot.ts` | Capture screen to file |
| `launch-app` | `launch-app.ts` | Launch app by package name |
| `install-apk` | `install-apk.ts` | Install APK file |

### ADB Providers (`src/shell/providers/`)

| File | Purpose |
|------|---------|
| `adb.ts` | `AdbProvider` interface and utilities |
| `adb-local.ts` | Local ADB execution via Bun.spawn() |
| `adb-mock.ts` | Mock provider for testing |

### Core Types (`src/core/types/`)

| File | Purpose |
|------|---------|
| `result.ts` | `CommandResult<T>` type and `ok()`/`err()`/`map()` helpers |
| `trace.ts` | Execution tracing for observability |
| `keys.ts` | Android keycode constants and resolution |
| `device.ts` | Device info types |
| `coordinates.ts` | Coordinate/point types |
| `app.ts` | App-related types |

### Contracts (`src/core/contracts/`)

| File | Purpose |
|------|---------|
| `inputs.ts` | Zod schemas for all command inputs |
| `outputs.ts` | Zod schemas for all command outputs |
| `config.ts` | `SkillConfig` schema with defaults |

### Domain Logic (`src/core/domain/`)

| File | Purpose |
|------|---------|
| `text-escape.ts` | Shell text escaping for ADB input |
| `device-parser.ts` | Parse `adb devices -l` output |

### Parsers (`src/core/parsers/`)

| File | Purpose |
|------|---------|
| `screen-xml.ts` | Parse UI Automator XML → compact JSON with pre-calculated centers |

### Utilities

| File | Purpose |
|------|---------|
| `src/core/cache.ts` | Memory-backed cache directory management (`/tmp/.ai-artifacts/...`) |
| `src/shell/formatters/` | Text and JSON output formatters |
| `src/shell/registry.ts` | Command registry with before/after hooks |

## Testing Approach

- **Framework**: Bun's built-in test runner (`bun test`)
- **Structure**: Tests mirror source structure in `src/tests/`
- **Mocking**: `adb-mock.ts` provider for isolated command testing
- **Coverage**: Core types, contracts, parsers, shell commands, formatters, registry

### Test Files

```
src/tests/
├── core/
│   ├── result.test.ts
│   ├── trace.test.ts
│   ├── keys.test.ts
│   ├── contracts.test.ts
│   ├── text-escape.test.ts
│   └── device-parser.test.ts
└── shell/
    ├── commands.test.ts
    ├── formatters.test.ts
    └── registry.test.ts
```

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, bin entry |
| `tsconfig.json` | TypeScript config with path aliases (`@core/*`, `@shell/*`) |
| `biome.json` | Linting and formatting (Biome) |
| `SKILL.md` | Skill documentation for AI agents |
| `AGENTS.md` | Agent-specific quality guidelines |

## External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | ^4.3.6 | Runtime schema validation |
| `@biomejs/biome` | ^2.3.13 | Linting and formatting |
| `@types/bun` | ^1.1.0 | Bun type definitions |
| `husky` | ^9.0.0 | Git hooks |
| `typescript` | ^5.0.0 (peer) | TypeScript compiler |

## Key Features

1. **Compact JSON Output**: `get-screen` filters ~336 raw XML nodes → ~55 useful elements with pre-calculated tap coordinates
2. **Multi-Device Support**: `-s <serial>` flag for targeting specific devices
3. **Caching**: Screen dumps cached to `/tmp/.ai-artifacts/skills/android-use/`
4. **Type Safety**: Full Zod validation for all inputs/outputs
5. **Observability**: Execution tracing with timing and ADB call history
6. **Cancellation**: AbortSignal support for long-running operations
7. **Flexible Output**: Text (human-readable) or JSON (machine-parseable) formats

## Workflow

1. **Check device**: `android-use check-device`
2. **Get screen state**: `android-use get-screen` → returns compact JSON with coordinates
3. **Execute action**: `tap`, `swipe`, `type-text`, `key`, etc.
4. **Verify**: Run `get-screen` again to confirm state change

## Cache Locations

- **Compact JSON**: `/tmp/.ai-artifacts/skills/android-use/screen.json`
- **Full XML**: `/tmp/.ai-artifacts/skills/android-use/screen.xml`

## Scripts

```bash
bun run dev          # Watch mode development
bun run build        # Compile to dist/
bun run test         # Run tests
bun run lint         # Biome linting
bun run format       # Biome formatting
bun run typecheck    # TypeScript check
```
