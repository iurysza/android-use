---
name: android-use
description: Control Android devices via ADB. Use when user asks to tap, swipe, type, launch apps, take screenshots, or automate Android device interactions.
version: 0.1.0
author: iurysza
license: MIT
keywords:
  - android
  - adb
  - device-control
  - automation
category: automation
tech-stack:
  - Bun
  - ADB
allowed-tools: Bash(android-use:*)
---

# Android Device Control

CLI for Android device control via ADB. Requires device connected with USB debugging enabled.

## Prerequisites

Before using this skill:

1. Android device with USB debugging enabled
2. ADB installed (`adb version` should work)
3. Device connected via USB or emulator running

## Agent Installation (Autonomous Setup)

When this skill is not installed, agents should:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/iurysza/android-use.git ~/.config/opencode/skill/android-use
   cd ~/.config/opencode/skill/android-use
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Build the project:**

   ```bash
   bun run build
   ```

4. **Create wrapper script:**

   ```bash
   ln -sf ~/.config/opencode/skill/android-use/dist/index.js ~/.config/opencode/skill/android-use/android-use
   chmod +x ~/.config/opencode/skill/android-use/android-use
   ```

5. **Verify installation:**
   ```bash
   ~/.config/opencode/skill/android-use/android-use check-device
   ```

## Quick Start

```bash
android-use check-device        # List connected devices
android-use get-screen          # Get UI hierarchy (compact JSON)
android-use tap 540 960         # Tap at coordinates
android-use type-text "Hello"   # Type text
android-use key HOME            # Press key
android-use screenshot ./screen.png  # Capture screen
```

## Core Agent Workflow

**STEP 1: Check device**

```bash
android-use check-device
```

- Lists all connected devices
- Note the serial number if multiple devices
- For "phone" use [PHYSICAL] device
- For "emulator" use [EMULATOR] device

**STEP 2: Get screen state**

```bash
android-use get-screen
```

- Returns compact JSON with pre-calculated tap coordinates
- Search for: `text`, `contentDesc`, `resourceId`
- Use the `center` field for coordinates (e.g., `"center": [540, 289]`)
- Cache location: `/tmp/.ai-artifacts/skills/android-use/screen.json`

**STEP 3: Execute action**

- Tap: `android-use tap <center_x> <center_y>`
- Type: `android-use tap <field_x> <field_y>` then `android-use type-text "text"`
- Swipe: `android-use swipe <x1> <y1> <x2> <y2> [duration_ms]`
- Key: `android-use key <KEY_NAME>` (HOME, BACK, ENTER, etc.)

**STEP 4: Verify and repeat**

- Run `get-screen` again to verify state change
- Handle any dialogs that appeared
- Repeat until goal achieved

## Commands

### Device & Screen

| Command        | Args              | Description                               |
| -------------- | ----------------- | ----------------------------------------- |
| `check-device` | `[serial]`        | List/verify connected devices             |
| `wake`         | `[serial]`        | Wake device + dismiss lock                |
| `get-screen`   | `[serial]`        | Dump UI accessibility tree (compact JSON) |
| `screenshot`   | `[path] [serial]` | Capture screen image                      |

### Input Actions

| Command     | Args                                | Description        |
| ----------- | ----------------------------------- | ------------------ |
| `tap`       | `<x> <y> [serial]`                  | Tap at coordinates |
| `type-text` | `<text> [serial]`                   | Type text string   |
| `swipe`     | `<x1> <y1> <x2> <y2> [ms] [serial]` | Swipe gesture      |
| `key`       | `<keycode\|name> [serial]`          | Press key          |

### App Management

| Command       | Args                 | Description                |
| ------------- | -------------------- | -------------------------- |
| `launch-app`  | `<package> [serial]` | Launch app by package name |
| `install-apk` | `<path> [serial]`    | Install APK file           |

## Global Options

| Option              | Description                        |
| ------------------- | ---------------------------------- |
| `-s, --serial <id>` | Target specific device             |
| `--json`            | Output as JSON                     |
| `--verbose`         | Verbose logging                    |
| `--timeout <ms>`    | Timeout (default: 15000)           |
| `--adb-path <path>` | Path to ADB binary                 |
| `--full`            | Full XML output (for `get-screen`) |

## Common App Package Names

Use these package names with `launch-app`:

| App Name | Package Name |
|----------|-------------|
| **Chrome** | `com.android.chrome` |
| **Settings** | `com.android.settings` |
| **Phone / Dialer** | `com.android.dialer` |
| **Messages / SMS** | `com.google.android.apps.messaging` |
| **Camera** | `com.android.camera` |
| **Photos** | `com.google.android.apps.photos` |
| **Gmail** | `com.google.android.gm` |
| **Maps** | `com.google.android.apps.maps` |
| **YouTube** | `com.google.android.youtube` |
| **Play Store** | `com.android.vending` |
| **Calendar** | `com.google.android.calendar` |
| **Clock** | `com.google.android.deskclock` |
| **Calculator** | `com.google.android.calculator` |
| **Contacts** | `com.android.contacts` |
| **Files** | `com.google.android.documentsui` |
| **WhatsApp** | `com.whatsapp` |
| **Instagram** | `com.instagram.android` |
| **Facebook** | `com.facebook.katana` |
| **Twitter / X** | `com.twitter.android` |
| **Spotify** | `com.spotify.music` |
| **Netflix** | `com.netflix.mediaclient` |
| **Telegram** | `org.telegram.messenger` |
| **Discord** | `com.discord` |
| **Slack** | `com.Slack` |
| **Zoom** | `us.zoom.videomeetings` |
| **Teams** | `com.microsoft.teams` |
| **Outlook** | `com.microsoft.office.outlook` |
| **Drive** | `com.google.android.apps.docs` |
| **Keep / Notes** | `com.google.android.keep` |
| **Reddit** | `com.reddit.frontpage` |
| **Bluesky** | `xyz.blueskyweb.app` |

## Reading Screen Data

**Compact JSON (default):**
`get-screen` outputs pre-calculated tap coordinates and filtered elements (99% smaller than XML):

```json
{
  "elements": [
    {
      "text": "Settings",
      "resourceId": "com.android.settings:id/title",
      "contentDesc": "",
      "clickable": true,
      "scrollable": false,
      "focused": false,
      "bounds": [42, 234, 1038, 345],
      "center": [540, 289]
    }
  ],
  "clickable": [...],
  "scrollable": [...],
  "withText": [...],
  "withContentDesc": [...]
}
```

**Key attributes:**

- `text` - Visible text
- `contentDesc` - Accessibility description (icons)
- `resourceId` - Element identifier
- `clickable` / `scrollable` - Interaction states
- `center` - Pre-calculated tap coordinates `[x, y]`
- `bounds` - Original bounds `[left, top, right, bottom]`

**Use pre-calculated center:**

- Already calculated: `tap 540 289` (no manual math needed)

**Full XML (when needed):**

- Use `get-screen --full` for raw XML
- Saves to `/tmp/.ai-artifacts/skills/android-use/screen.xml`

**Cache location (memory-backed):**

- `/tmp/.ai-artifacts/skills/android-use/screen.json` (compact)
- `/tmp/.ai-artifacts/skills/android-use/screen.xml` (full)

## Key Names

`HOME`, `BACK`, `MENU`, `POWER`, `ENTER`, `TAB`, `DEL`, `ESCAPE`, `VOLUME_UP`, `VOLUME_DOWN`, `DPAD_UP`, `DPAD_DOWN`, `DPAD_LEFT`, `DPAD_RIGHT`

## Multi-Device Support

When multiple devices connected:

1. Run `check-device` to see all devices with types
2. User says "phone/physical" -> use `[PHYSICAL]` device
3. User says "emulator" -> use `[EMULATOR]` device
4. Pass `-s <serial>` to ALL subsequent commands

```bash
android-use check-device
# Multiple devices connected (2):
#   [PHYSICAL] 1A051FDF6007PA - Pixel 6
#   [EMULATOR] emulator-5554 - sdk_gphone64_arm64

android-use -s 1A051FDF6007PA get-screen
android-use -s 1A051FDF6007PA tap 540 960
```

## Common Patterns

### Tap a button

```bash
android-use get-screen              # Get JSON with pre-calculated centers
# Search JSON for button, find center: [540, 289]
android-use tap 540 289             # Tap at center
```

### Enter text in field

```bash
android-use tap 540 184             # Focus field
android-use type-text "search term"
android-use key ENTER               # Submit
```

### Scroll to find content

```bash
android-use get-screen              # Check if visible
android-use swipe 540 1500 540 500  # Swipe up (scroll down)
android-use get-screen              # Check again
```

### Handle dialogs

```bash
# Look for "OK", "Allow", "Accept" buttons in XML
android-use tap <button-center>
# Or dismiss with back
android-use key BACK
```

### Open app and navigate

```bash
android-use launch-app com.android.chrome
android-use get-screen
# Find URL bar, tap it
android-use tap 540 184
android-use type-text "example.com"
android-use key ENTER
```

## Agent Examples

See the `examples/` directory in the repository for:

- `basic-device-check.sh` - Verify device connectivity
- `app-navigation.sh` - Launch and navigate apps
- `form-filling.sh` - Automated form input
- `scroll-and-search.sh` - Find content by scrolling
- `multi-device.sh` - Manage multiple devices
- `AGENT_WORKFLOWS.md` - Best practices for AI agents

## JSON Output

Use `--json` for structured output:

```bash
android-use --json check-device
```

```json
{
  "success": true,
  "exitCode": 0,
  "data": { "devices": [...], "count": 1 },
  "message": "Found 1 device(s)",
  "trace": { ... }
}
```

## Error Handling

- **No device**: Check USB, verify USB debugging enabled, accept "Allow USB debugging?" prompt
- **Element not found**: Get fresh screen dump, try scrolling
- **Action didn't work**: Add minimal delay (300ms max) only if retrying, then verify coordinates, check for popups/dialogs, get fresh screen dump
- **Device offline**: Reconnect USB, run `adb kill-server && adb start-server`

## Agent Best Practices

1. **Always get-screen first** - understand current UI state
2. **No artificial delays needed** - Commands execute synchronously; UI is ready for next command immediately
3. **Check your work** - get-screen after each action to verify
4. **Use screenshots** - when JSON doesn't capture enough info
5. **Be consistent** - use same serial for all commands in session
6. **Compact JSON default** - 99% smaller, pre-calculated tap coords, cached to `/tmp/.ai-artifacts/skills/android-use/`
7. **Handle dialogs** - popups often block interactions
8. **Use center coordinates** - from JSON output, no manual calculation needed

## Compact JSON Filter Logic

The compact JSON includes elements with ANY of:

- Non-empty `text` (visible labels)
- Non-empty `contentDesc` (accessibility descriptions)
- `clickable = true` (interactive elements)
- `scrollable = true` (scrollable containers)

This filters ~336 raw nodes → ~55 useful elements (4x smaller)

## Repository

- GitHub: https://github.com/iurysza/android-use
- Issues: https://github.com/iurysza/android-use/issues
- Examples: See `examples/` directory in repository
