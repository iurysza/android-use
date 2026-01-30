# Commands Implementation

**Status:** Pending  
**Priority:** High

## Objective

Implement all 10 commands following the established pattern.

## Commands

- [ ] `check-device` - list/verify connected devices
- [ ] `wake` - wake device and dismiss lock
- [ ] `get-screen` - dump UI XML hierarchy
- [ ] `tap` - tap coordinates
- [ ] `type-text` - type text with escaping
- [ ] `swipe` - swipe gestures
- [ ] `key` - press keycodes
- [ ] `screenshot` - capture screen
- [ ] `launch-app` - launch apps by name/package
- [ ] `install-apk` - install APKs

## Pure Domain Functions (Core)

- [ ] `src/core/domain/coordinates.ts`
- [ ] `src/core/domain/text-escape.ts`
- [ ] `src/core/domain/keycodes.ts`
- [ ] `src/core/domain/device-parser.ts`
- [ ] `src/core/domain/app-resolver.ts`
- [ ] `src/core/domain/screen-dimensions.ts`

## Notes

Start with `tap` as reference impl, then replicate pattern.
