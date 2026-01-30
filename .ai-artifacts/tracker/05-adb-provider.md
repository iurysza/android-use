# ADB Provider

**Status:** Pending  
**Priority:** High

## Objective

Implement provider abstraction for ADB execution.

## Subtasks

- [ ] `src/shell/providers/adb.ts` - AdbProvider interface
- [ ] `src/shell/providers/adb-local.ts` - LocalAdbProvider (Bun.$)
- [ ] `src/shell/providers/adb-mock.ts` - MockAdbProvider (tests)
- [ ] AbortSignal support for cancellation
- [ ] Timeout handling

## Interface

```typescript
interface AdbProvider {
  exec(args: readonly string[], options: ExecOptions): Promise<ADBResult>;
}

interface ExecOptions {
  timeoutMs: number;
  signal?: AbortSignal;
}
```
