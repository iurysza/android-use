# Zod Contracts

**Status:** Pending  
**Priority:** High

## Objective

Define Zod schemas for input validation and output contracts.

## Subtasks

- [ ] `src/core/contracts/inputs.ts` - Input schemas for all 10 commands
- [ ] `src/core/contracts/outputs.ts` - Output schemas
- [ ] `src/core/contracts/config.ts` - SkillConfigSchema

## Input Schemas Needed

- [ ] TapInputSchema
- [ ] SwipeInputSchema
- [ ] TypeTextInputSchema
- [ ] KeyInputSchema
- [ ] ScreenshotInputSchema
- [ ] LaunchAppInputSchema
- [ ] InstallApkInputSchema
- [ ] CheckDeviceInputSchema
- [ ] WakeInputSchema
- [ ] GetScreenInputSchema

## Notes

Validate at boundary, trust interior.
