# Manual Test Plan - android-use

## Prerequisites

- [ ] Android device connected via USB or emulator running
- [ ] ADB installed and in PATH
- [ ] Run `adb devices` to confirm device visible
- [ ] Note device serial: `______________`

## Setup

```bash
cd /Users/iurysouza/projects/my-repos/vibe-coded/android-use
bun install
```

---

## 1. Basic CLI

### 1.1 Help & Version
```bash
bun run start --help
bun run start --version
```
- [ ] Help shows all commands and options
- [ ] Version shows `android-use v0.1.0`

### 1.2 Unknown Command
```bash
bun run start unknown-cmd
```
- [ ] Shows error: "Unknown command: unknown-cmd"
- [ ] Exit code is 1

---

## 2. Device Commands

### 2.1 check-device (list all)
```bash
bun run start check-device
bun run start --json check-device
```
- [ ] Text output shows device(s) with serial, state, model
- [ ] JSON output has `success: true` and `data.devices` array

### 2.2 check-device (specific serial)
```bash
bun run start check-device <YOUR_SERIAL>
bun run start check-device nonexistent123
```
- [ ] Valid serial: shows device info
- [ ] Invalid serial: error "Device not found"

---

## 3. Wake Command (Tests Fix #1 & #2)

### 3.1 Basic Wake
```bash
# Lock device first (press power button or wait for timeout)
bun run start wake
bun run start --json wake
```
- [ ] Device screen turns on
- [ ] Lock screen dismissed (swipe up gesture)
- [ ] Output shows `wasAsleep` and `isAwake` status
- [ ] Works on different screen sizes (tests dynamic dimensions fix)

### 3.2 Wake with Serial
```bash
bun run start -s <YOUR_SERIAL> wake
```
- [ ] Works with explicit serial flag

---

## 4. Input Commands

### 4.1 tap
```bash
# Open an app with a button first
bun run start tap 500 500
bun run start --json tap 200 300
```
- [ ] Tap registers on device at coordinates
- [ ] JSON shows `success: true` with x, y in data

### 4.2 tap - invalid input
```bash
bun run start tap
bun run start tap abc def
bun run start tap -100 200
```
- [ ] Missing coords: error
- [ ] Non-numeric: error  
- [ ] Negative: error

### 4.3 swipe
```bash
bun run start swipe 500 1500 500 500
bun run start swipe 500 1500 500 500 500
bun run start --json swipe 100 800 100 200
```
- [ ] Basic swipe works (scroll up gesture)
- [ ] Custom duration (500ms) works
- [ ] JSON shows all coordinates + durationMs in trace (tests fix #6)

### 4.4 type-text (Tests Fix #3)
```bash
# Open a text field first (e.g., browser URL bar, notes app)
bun run start type-text "Hello World"
bun run start type-text "test@email.com"
bun run start --json type-text "Testing 123"
```
- [ ] Text appears in focused field
- [ ] Special chars like @ work
- [ ] JSON shows text and length

### 4.5 type-text with serial (Tests Fix #3)
```bash
bun run start -s <YOUR_SERIAL> type-text "Serial test"
```
- [ ] Works with --serial flag (not inline serial detection)

### 4.6 key
```bash
bun run start key HOME
bun run start key BACK
bun run start key home
bun run start key 3
bun run start --json key VOLUME_UP
```
- [ ] HOME goes to home screen
- [ ] BACK navigates back
- [ ] Case insensitive (home = HOME)
- [ ] Numeric keycode works (3 = HOME)
- [ ] Volume up works, JSON shows keycode

---

## 5. Screen Commands

### 5.1 screenshot
```bash
bun run start screenshot
bun run start screenshot ./test-screen.png
bun run start --json screenshot ./test2.png
ls -la *.png
```
- [ ] Default saves to `./screenshot.png`
- [ ] Custom path works
- [ ] JSON shows path and byteSize
- [ ] Files exist and are valid PNGs

### 5.2 get-screen (UI dump)
```bash
bun run start get-screen
bun run start --json get-screen
```
- [ ] Outputs XML hierarchy
- [ ] JSON has `data.xml` with UI elements
- [ ] Shows byteSize

---

## 6. App Commands

### 6.1 launch-app (Tests Fix #4)
```bash
bun run start launch-app com.android.settings
bun run start --json launch-app com.android.calculator2
bun run start -s <YOUR_SERIAL> launch-app com.android.settings
```
- [ ] Settings app opens
- [ ] Calculator opens (if installed)
- [ ] Works with --serial flag
- [ ] JSON shows packageName and launchTime (if -W flag worked)

### 6.2 launch-app - invalid
```bash
bun run start launch-app com.nonexistent.fake
```
- [ ] Error: app not found

### 6.3 install-apk (Tests Fix #5)
```bash
# Skip if no test APK available
bun run start install-apk /path/to/test.apk
bun run start -s <YOUR_SERIAL> install-apk /path/to/test.apk
```
- [ ] APK installs successfully
- [ ] Works with --serial flag
- [ ] Error for non-existent path: "APK file not found"

---

## 7. Global Options

### 7.1 --serial flag
```bash
bun run start -s <YOUR_SERIAL> check-device
bun run start --serial <YOUR_SERIAL> tap 500 500
```
- [ ] Short form `-s` works
- [ ] Long form `--serial` works

### 7.2 --json output
```bash
bun run start --json check-device
bun run start --json tap 100 100
```
- [ ] All commands output valid JSON
- [ ] JSON has: success, exitCode, data, message, trace

### 7.3 --verbose
```bash
bun run start --verbose screenshot ./verbose-test.png
```
- [ ] Shows additional logging (if any errors occur)

### 7.4 --timeout
```bash
bun run start --timeout 5000 check-device
```
- [ ] Command respects timeout (hard to test without slow device)

---

## 8. Error Handling

### 8.1 No device connected
```bash
# Disconnect device first
bun run start check-device
bun run start tap 100 100
```
- [ ] Graceful error message
- [ ] Exit code is non-zero

### 8.2 ADB not found
```bash
bun run start --adb-path /nonexistent/adb check-device
```
- [ ] Error about ADB binary

---

## 9. Trace Verification

```bash
bun run start --json tap 500 500 | jq '.trace'
bun run start --json swipe 100 800 100 200 300 | jq '.trace.calls'
```
- [ ] Trace includes command name
- [ ] Trace includes startTime, endTime, durationMs
- [ ] Trace calls array shows ADB commands executed
- [ ] Swipe trace includes duration argument (fix #6)

---

## 10. Multi-Device (if available)

```bash
# With 2+ devices connected
bun run start check-device
bun run start -s <DEVICE1_SERIAL> tap 500 500
bun run start -s <DEVICE2_SERIAL> tap 500 500
```
- [ ] Lists all devices
- [ ] Commands target correct device with -s flag

---

## Cleanup

```bash
rm -f screenshot.png test-screen.png test2.png verbose-test.png
```

---

## Test Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Basic CLI | | | |
| Device Commands | | | |
| Wake Command | | | |
| Input Commands | | | |
| Screen Commands | | | |
| App Commands | | | |
| Global Options | | | |
| Error Handling | | | |
| Trace | | | |
| Multi-Device | | | |

**Tester:** ________________  
**Date:** ________________  
**Device:** ________________  
**Overall Result:** PASS / FAIL
