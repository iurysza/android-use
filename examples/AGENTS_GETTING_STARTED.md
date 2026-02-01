# Agent Getting Started Guide

This guide helps AI agents set up and use the android-use skill to control Android devices.

## Quick Setup (One Command)

```bash
curl -fsSL https://raw.githubusercontent.com/iurysza/android-use/main/install.sh | bash
```

This automatically:
1. Clones the repo to `~/.config/opencode/skill/android-use`
2. Installs dependencies with `bun install`
3. Builds the project with `bun run build`
4. Creates the wrapper script
5. Verifies installation

## Manual Setup

If the automatic installer doesn't work:

```bash
# 1. Clone repository
git clone https://github.com/iurysza/android-use.git ~/.config/opencode/skill/android-use
cd ~/.config/opencode/skill/android-use

# 2. Install dependencies
bun install

# 3. Build
bun run build

# 4. Create wrapper
ln -sf ~/.config/opencode/skill/android-use/dist/index.js ~/.config/opencode/skill/android-use/android-use
chmod +x ~/.config/opencode/skill/android-use/android-use

# 5. Verify
~/.config/opencode/skill/android-use/android-use check-device
```

## Prerequisites Check

Before using, verify:

```bash
# Check ADB is installed
adb version

# Check device is connected
adb devices
```

Expected output:
```
List of devices attached
XXXXXXXXXXXXXXX device
```

If no device appears:
1. Connect Android device via USB
2. Enable USB debugging (Settings → Developer options → USB debugging)
3. Accept "Allow USB debugging?" prompt on device

## Essential Commands

### 1. Device Management

```bash
# List devices
android-use check-device

# Wake device
android-use wake
```

### 2. Screen Analysis

```bash
# Get UI hierarchy (returns compact JSON)
android-use get-screen

# Full XML dump
android-use get-screen --full
```

### 3. Input Actions

```bash
# Tap at coordinates (use center from get-screen)
android-use tap 540 960

# Type text
android-use type-text "Hello World"

# Press key
android-use key HOME
android-use key BACK
android-use key ENTER

# Swipe
android-use swipe 540 1500 540 500
```

### 4. App Control

```bash
# Launch app
android-use launch-app com.android.chrome

# Install APK
android-use install-app ./app.apk
```

## Agent Workflow Pattern

Always follow this 4-step workflow:

### Step 1: Check Device
```bash
android-use check-device
```
Note the serial number if multiple devices.

### Step 2: Get Screen State
```bash
android-use get-screen
```
Returns JSON with pre-calculated tap coordinates.

### Step 3: Execute Action
Use coordinates from the `center` field:
```bash
# Example: button at center [540, 289]
android-use tap 540 289
```

### Step 4: Verify
```bash
android-use get-screen
```
Confirm the action worked.

## Reading Screen Data

The `get-screen` JSON includes:

```json
{
  "elements": [
    {
      "text": "Settings",
      "resourceId": "com.android.settings:id/title",
      "contentDesc": "",
      "clickable": true,
      "center": [540, 289],
      "bounds": [42, 234, 1038, 345]
    }
  ]
}
```

**Key fields:**
- `text`: Visible text
- `contentDesc`: Icon descriptions
- `clickable`: Can tap this?
- `center`: Pre-calculated [x, y] tap coordinates
- `bounds`: [left, top, right, bottom]

## Multi-Device Support

```bash
# List all devices
android-use check-device
# Output:
#   [PHYSICAL] 1A051FDF6007PA - Pixel 6
#   [EMULATOR] emulator-5554 - sdk_gphone64_arm64

# Use specific device
android-use -s 1A051FDF6007PA get-screen
android-use -s 1A051FDF6007PA tap 540 960
```

## Common Patterns

### Tap a Button
```bash
android-use get-screen
# Find button, note center coordinates
android-use tap 540 289
```

### Fill a Form
```bash
# Tap first field
android-use tap 540 600
android-use type-text "username"

# Tap next field
android-use tap 540 800
android-use type-text "password"

# Submit
android-use tap 540 1000
```

### Scroll to Find Content
```bash
# Check if visible
android-use get-screen

# Swipe up (scroll down)
android-use swipe 540 1500 540 500

# Check again
android-use get-screen
```

### Handle Dialogs
```bash
# Look for OK/Allow/Accept buttons
android-use get-screen
android-use tap <button-center>

# Or dismiss with back
android-use key BACK
```

### Open App and Navigate
```bash
android-use launch-app com.android.chrome
android-use get-screen
# Find and tap URL bar
android-use tap 540 184
android-use type-text "example.com"
android-use key ENTER
```

## Best Practices

1. **Always check device first** - Run `check-device` before any session
2. **Use pre-calculated centers** - From JSON `center` field
3. **No need to wait** - Commands are synchronous; UI updates complete before next command. Only add minimal delay (300ms max) if an action fails and you're retrying
4. **Verify with get-screen** - After each important action
5. **Handle dialogs** - Popups block interactions
6. **Use consistent serial** - Same device for all commands in session

## Troubleshooting

### No device found
- Check USB connection
- Enable USB debugging on device
- Accept debugging prompt on device
- Try: `adb kill-server && adb start-server`

### Element not found
- Get fresh screen dump
- Try scrolling
- Coordinates vary by device resolution

### Action didn't work
- Add minimal delay (300ms max) only if retrying
- Verify coordinates
- Check for blocking dialogs
- Get fresh screen dump to confirm state

## Examples

See other files in this directory:
- `01-taking-a-screenshot.md`
- `02-opening-an-app.md`
- `03-tapping-a-button.md`
- `04-filling-a-form.md`
- `05-scrolling-to-find-content.md`
- `06-handling-dialogs.md`
- `AGENT_WORKFLOWS.md`

## Repository

- GitHub: https://github.com/iurysza/android-use
- Issues: https://github.com/iurysza/android-use/issues
