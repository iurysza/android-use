# CLI Router

**Status:** Pending  
**Priority:** High

## Objective

Implement CLI entry point with argument parsing and dispatch.

## Subtasks

- [ ] `src/index.ts` - Entry point
- [ ] `src/shell/cli.ts` - Argument parsing
- [ ] Global flags handling
- [ ] Command dispatch to registry
- [ ] Exit code mapping

## Global Flags

- `-s, --serial <id>` - Device serial
- `--adb-path <path>` - ADB binary path
- `--timeout <ms>` - Timeout in ms
- `--retries <n>` - Retry count
- `--json` - JSON output
- `--verbose` - Verbose logging
- `--help` - Show help
- `--version` - Show version
