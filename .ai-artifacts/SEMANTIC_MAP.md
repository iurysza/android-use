# SEMANTIC_MAP: android-use

CLI + library for Android device control via ADB.  
**Runtime:** Bun + TypeScript | **Architecture:** Functional Core / Imperative Shell

---

## Project Status

```
Phase 1: Foundation      [████████████] COMPLETE
Phase 2: Infrastructure  [████████████] COMPLETE
Phase 3: Commands        [████████████] COMPLETE
Phase 4: CLI & Polish    [████░░░░░░░░] IN PROGRESS
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPERATIVE SHELL                         │
│           (Side Effects: ADB, File I/O, Console)            │
│                                                             │
│  src/shell/                                                 │
│  ├── commands/     → 10 command implementations (DONE)      │
│  ├── providers/    → ADB abstraction (DONE)                 │
│  ├── formatters/   → text/json output (DONE)                │
│  └── observability/→ Trace impl (via types)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     FUNCTIONAL CORE                         │
│              (Pure Logic: No I/O, No Side Effects)          │
│                                                             │
│  src/core/                                                  │
│  ├── types/        → Domain types (DONE)                    │
│  ├── contracts/    → Zod schemas (DONE)                     │
│  └── domain/       → Pure parsers/utils (DONE)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Domain Concepts

### Device Management
- `src/core/types/device.ts` → Device, DeviceState, DeviceTransport, ScreenInfo
- `src/core/domain/device-parser.ts` → `parseDeviceList()`, `findDevice()`, `isDeviceReady()`
- States: device|offline|unauthorized|no permissions|bootloader|recovery|sideload|unknown
- Transport: usb|wifi|unknown

### Coordinates & Gestures
- `src/core/types/coordinates.ts` → Point, Rect, SwipeGesture, SwipeDirection
- Pure utils: `rectCenter()`, `pointInRect()`

### Android Keys
- `src/core/types/keys.ts` → KEYCODES const, Keycode, KeyName
- 25+ keycodes: HOME, BACK, POWER, VOLUME_*, DPAD_*, MEDIA_*, etc.
- `resolveKeycode()`, `isKeyName()` helpers

### Text Handling
- `src/core/domain/text-escape.ts` → `escapeForAdbInput()`, `splitTextForInput()`
- Handles: spaces→%s, shell chars, command length limits
- `isAsciiPrintable()`, `escapeShellArg()` helpers

### App Management
- `src/core/types/app.ts` → PackageName, ActivityComponent, AppInfo, LaunchOptions, InstallOptions
- `formatComponent()`, `parseComponent()` helpers

### Result Pattern
- `src/core/types/result.ts` → CommandResult<T>, ErrorCode, ResultError
- Error codes: INVALID_INPUT|ADB_FAILED|TIMEOUT|CANCELLED|DEVICE_NOT_FOUND|DEVICE_OFFLINE|DEVICE_UNAUTHORIZED|FILE_NOT_FOUND|PARSE_ERROR|UNKNOWN
- Utilities: `ok()`, `err()`, `isOk()`, `isErr()`, `map()`

### Execution Trace
- `src/core/types/trace.ts` → ExecutionTrace, AdbCall, TraceBuilder
- `createTraceBuilder()` factory

---

## Shell Layer

### Providers (`src/shell/providers/`)
| Provider | Purpose |
|----------|---------|
| `adb.ts` | AdbProvider interface, ExecOptions, AdbResult |
| `adb-local.ts` | LocalAdbProvider - real ADB via Bun.spawn |
| `adb-mock.ts` | MockAdbProvider - testing with preset responses |

**Key helpers:** `isAdbSuccess(result)`, `buildAdbArgs(args, serial)`

### Formatters (`src/shell/formatters/`)
| File | Purpose |
|------|---------|
| `index.ts` | `getFormatter()`, `format()`, `registerFormatter()` |
| `text.ts` | ANSI colors, ✓/✗ symbols, NO_COLOR support |
| `json.ts` | JSON.stringify (pretty + compact) |

### Commands (`src/shell/commands/`)
All 10 commands implemented:

| Command | File | Purpose |
|---------|------|---------|
| check-device | `check-device.ts` | list/verify devices |
| wake | `wake.ts` | wake + dismiss lock |
| get-screen | `get-screen.ts` | dump UI XML |
| tap | `tap.ts` | tap x,y |
| type-text | `type-text.ts` | type text with escaping |
| swipe | `swipe.ts` | swipe gesture |
| key | `key.ts` | press keycode |
| screenshot | `screenshot.ts` | capture screen |
| launch-app | `launch-app.ts` | launch app |
| install-apk | `install-apk.ts` | install APK |

---

## Zod Contracts

### Input Schemas (`src/core/contracts/inputs.ts`)
| Schema | Purpose |
|--------|---------|
| CheckDeviceInputSchema | list/verify devices |
| WakeInputSchema | wake + dismiss lock |
| GetScreenInputSchema | dump UI XML |
| TapInputSchema | tap x,y |
| TypeTextInputSchema | type text |
| SwipeInputSchema | swipe start→end |
| SwipeDirectionInputSchema | swipe by direction |
| KeyInputSchema | press keycode |
| ScreenshotInputSchema | capture screen |
| LaunchAppInputSchema | launch app |
| InstallApkInputSchema | install APK |

### Output Schemas (`src/core/contracts/outputs.ts`)
- Per-command: DeviceOutput, WakeOutput, TapOutput, etc.
- Generic: CommandResultSchema, ExecutionTraceSchema

### Config (`src/core/contracts/config.ts`)
```typescript
SkillConfigSchema {
  adbPath: string = "adb"
  timeoutMs: number = 15000
  maxRetries: number = 1
  outputFormat: "text" | "json" = "text"
  verbose: boolean = false
  defaultSerial: string | null = null
}
```

---

## Data Flow

```
CLI args → Zod validate → Command handler → ADB provider → Parse output → CommandResult<T>
                ↓                                                              ↓
           INVALID_INPUT                                              ok(data) | err(code)
                                                                              ↓
                                                                    Formatter → stdout
```

---

## File Map

```
src/
├── index.ts                  # Main entry point
├── core/
│   ├── types/
│   │   ├── index.ts          # Barrel export
│   │   ├── device.ts         # Device, DeviceState, ScreenInfo
│   │   ├── coordinates.ts    # Point, Rect, SwipeGesture
│   │   ├── keys.ts           # KEYCODES, resolveKeycode()
│   │   ├── app.ts            # PackageName, AppInfo, LaunchOptions
│   │   ├── result.ts         # CommandResult<T>, ok(), err()
│   │   └── trace.ts          # ExecutionTrace, TraceBuilder
│   ├── contracts/
│   │   ├── index.ts          # Barrel export
│   │   ├── inputs.ts         # 11 input schemas
│   │   ├── outputs.ts        # 11 output schemas + CommandResultSchema
│   │   └── config.ts         # SkillConfigSchema, DEFAULT_CONFIG
│   └── domain/
│       ├── index.ts          # Barrel export
│       ├── device-parser.ts  # parseDeviceList(), findDevice()
│       └── text-escape.ts    # escapeForAdbInput(), splitTextForInput()
├── shell/
│   ├── commands/
│   │   ├── index.ts          # Barrel export
│   │   ├── check-device.ts   # list/verify devices
│   │   ├── wake.ts           # wake + dismiss lock
│   │   ├── get-screen.ts     # dump UI XML
│   │   ├── tap.ts            # tap x,y
│   │   ├── type-text.ts      # type text
│   │   ├── swipe.ts          # swipe gesture
│   │   ├── key.ts            # press keycode
│   │   ├── screenshot.ts     # capture screen
│   │   ├── launch-app.ts     # launch app
│   │   └── install-apk.ts    # install APK
│   ├── providers/
│   │   ├── index.ts          # Barrel export
│   │   ├── adb.ts            # AdbProvider interface
│   │   ├── adb-local.ts      # LocalAdbProvider (Bun.spawn)
│   │   └── adb-mock.ts       # MockAdbProvider + presets
│   └── formatters/
│       ├── index.ts          # getFormatter(), format()
│       ├── text.ts           # ANSI text formatter
│       └── json.ts           # JSON formatter
└── tests/                    # (pending)
```

---

## Path Aliases

```json
"@core/*"  → "src/core/*"
"@shell/*" → "src/shell/*"
```

---

## Dependencies

- `zod@4.3.6` - Schema validation
- `@biomejs/biome` - Lint/format (dev)
- `typescript@^5.0.0` - Type checking (peer)

---

## Commands Status

| Command | Schema | Handler | Status |
|---------|--------|---------|--------|
| check-device | ✓ | ✓ | ✅ |
| wake | ✓ | ✓ | ✅ |
| get-screen | ✓ | ✓ | ✅ |
| tap | ✓ | ✓ | ✅ |
| type-text | ✓ | ✓ | ✅ |
| swipe | ✓ | ✓ | ✅ |
| key | ✓ | ✓ | ✅ |
| screenshot | ✓ | ✓ | ✅ |
| launch-app | ✓ | ✓ | ✅ |
| install-apk | ✓ | ✓ | ✅ |

---

## Key Principles

1. **Validate at boundary** - Zod at entry, trust interior
2. **Rich results** - CommandResult<T>, never primitives
3. **Provider abstraction** - LocalAdbProvider + MockAdbProvider
4. **Trace everything** - ExecutionTrace on every result
5. **3 abstraction levels** - CLI, command API, primitives

---

## Next Steps

1. Wire up CLI router with arg parsing
2. Add tests using MockAdbProvider
3. Add observability hooks (logging, metrics)
4. Documentation and examples

---

<!-- GIT_COMMIT: d514726 -->
