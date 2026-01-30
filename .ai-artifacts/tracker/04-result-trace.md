# CommandResult & ExecutionTrace

**Status:** Pending  
**Priority:** High

## Objective

Implement rich result type and lightweight observability.

## Subtasks

- [ ] CommandResult factory functions (`ok`, `error`)
- [ ] ErrorCode type definition
- [ ] ExecutionTrace builder
- [ ] Trace start/finish helpers

## CommandResult Shape

```typescript
type CommandResult<T> = {
  success: boolean;
  exitCode: number;
  message?: string;
  data?: T;
  error?: { code: ErrorCode; message: string };
  warnings?: string[];
  trace?: ExecutionTrace;
  metadata?: Record<string, string | number | boolean>;
};
```

## ErrorCodes

- INVALID_INPUT
- ADB_FAILED
- TIMEOUT
- CANCELLED
- DEVICE_NOT_FOUND
- UNKNOWN
