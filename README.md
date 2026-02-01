# android-use

<p align="center">
  <img src="./assets/logo-banner.png?v=2" alt="android-use logo" width="400">
</p>

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/iurysza/android-use/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.3.8+-black.svg)](https://bun.sh)

Control Android devices programmatically. Tap, swipe, type, launch apps, and automate UI interactions with structured, agent-friendly output.

🤖 **Agents, start here:** [Getting Started Guide](./examples/AGENTS_GETTING_STARTED.md)

## Why android-use?

**What:** A semantic layer over ADB. Simplifies and standardizes device interactions into consistent, predictable commands that agents can reliably parse and execute.

**Why:** Raw ADB outputs unstructured text. This tool returns structured JSON with consistent error handling, screen coordinates parsed from accessibility trees, and clear success/failure states. Screen dumps are compact and token-efficient (~50-200 tokens vs thousands for raw XML), perfect for LLM agents with context limits.

**How:** Perception → Action loop. Get the UI state as structured data, reason about it, execute the next action. Repeat.

| Raw ADB | android-use |
|---------|-------------|
| `adb shell dumpsys window windows` + parsing | `android-use get-screen` → structured JSON |
| `adb shell input tap 540 960` | `android-use tap 540 960` with validation |
| Exit code 0 or manual string checking | Typed results: `{success: true, data: {...}}` |

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/iurysza/android-use/main/install.sh | bash
```

**Prerequisites:** ADB installed, Android device with USB debugging enabled.

## Quick Start

```bash
android-use check-device                # List devices
android-use get-screen                  # Get UI with tap coordinates
android-use tap 540 960                 # Tap at coordinates
android-use type-text "Hello"           # Type text
android-use launch-app com.android.chrome  # Launch app
```

## Documentation

- [Agent Setup Guide](./examples/AGENTS_GETTING_STARTED.md) - Complete setup and usage guide
- [Examples](./examples/) - Tutorials and common patterns
- [Changelog](./CHANGELOG.md)

## License

MIT
