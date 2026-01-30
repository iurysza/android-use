# Registry & Hooks

**Status:** Pending  
**Priority:** Medium

## Objective

Implement command registry and lifecycle hooks.

## Subtasks

- [ ] `src/shell/registry.ts` - Command registry
- [ ] `registerCommand(name, handler)` function
- [ ] `onBeforeCommand` hook
- [ ] `onAfterCommand` hook
- [ ] CommandContext type

## CommandContext

```typescript
type CommandContext = {
  adb: AdbProvider;
  config: SkillConfig;
  trace: TraceBuilder;
  signal?: AbortSignal;
};
```
