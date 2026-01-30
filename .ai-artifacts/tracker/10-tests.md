# Tests

**Status:** Pending  
**Priority:** Medium

## Objective

Comprehensive test coverage for core and shell.

## Subtasks

- [ ] Core tests - pure logic, no mocks
- [ ] Schema tests - Zod validation
- [ ] Shell tests - MockAdbProvider
- [ ] CLI tests - JSON output contract
- [ ] Integration tests - real ADB (optional)

## Test Categories

### Core Tests
- [ ] coordinates.ts
- [ ] text-escape.ts
- [ ] keycodes.ts
- [ ] device-parser.ts
- [ ] app-resolver.ts

### Schema Tests
- [ ] Input validation (valid/invalid)
- [ ] Output serialization

### Shell Tests
- [ ] Each command with mock provider
- [ ] Error handling
- [ ] Timeout/cancellation
