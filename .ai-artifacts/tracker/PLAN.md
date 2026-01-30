# Android-Use Implementation Tracker

**Status:** Planning Complete - Ready to Implement  
**Last Updated:** 2026-01-30

---

## Phase 1: Foundation

- [ ] [Project Setup](./01-project-setup.md)
- [ ] [Core Types](./02-core-types.md)
- [ ] [Zod Contracts](./03-zod-contracts.md)

## Phase 2: Infrastructure

- [ ] [CommandResult & Trace](./04-result-trace.md)
- [ ] [ADB Provider](./05-adb-provider.md)
- [ ] [Formatters](./06-formatters.md)
- [ ] [Registry & Hooks](./07-registry-hooks.md)

## Phase 3: Commands

- [ ] [Commands Implementation](./08-commands.md)

## Phase 4: CLI & Polish

- [ ] [CLI Router](./09-cli-router.md)
- [ ] [Tests](./10-tests.md)
- [ ] [Documentation](./11-docs.md)

---

## Pre-Ship Checklist

- [ ] 3 abstraction levels (CLI, command API, primitives)
- [ ] Zod schemas for all inputs/outputs/configs
- [ ] Commands return `CommandResult` (no primitives)
- [ ] Configurable timeouts, retries, output format
- [ ] Provider abstraction (local ADB + mock)
- [ ] Extension points (hooks/registry/formatters)
- [ ] Lightweight execution trace on every result
- [ ] Fail-fast validation + graceful degradation
- [ ] `--json` structured output supported
- [ ] Actionable error messages + examples
- [ ] CLI `--help` and docs updated

---

<!-- GIT_COMMIT_HASH: NO_COMMITS_YET -->
