# AGENTS.md

CLI/agent skill for structured Android device control.

## Map

| Path | What lives there |
| --- | --- |
| `README.md` | Product overview, install, and command examples |
| `src/` | CLI and library source |
| `references/` | Agent setup and usage patterns |
| `ai-artifacts/` | How-it-works docs for agents |

## ai-artifacts

How-it-works docs belong in `ai-artifacts/`. Update them when architecture or behavior changes. Start at [ai-artifacts/_index.md](./ai-artifacts/_index.md).

## Quality tools (Bun)
- Lint: `bun run lint` (Biome)
- Format (write): `bun run format` (Biome)
- Format check: `bun run format:check` (Biome)
- Typecheck: `bun run typecheck` (tsc)
- Tests: `bun test`
- Build: `bun run build`

## Agentic self-correct loop
1) Make a small change.
2) Run `bun run format` and re-check the diff.
3) Run `bun run lint`.
4) Run `bun run typecheck`.
5) Run `bun test`.
6) Run `bun run build` (if touching CLI/build code).
7) If anything fails, fix it and repeat steps 2-6 until green.

## One-liner check
```bash
bun run format && bun run lint && bun run typecheck && bun test
```

## Notes
- Formatting and linting are handled by Biome (`biome.json`).
- Use `bun run <script>` to avoid name collisions with Bun built-ins.

## Git commits
Never include Cursor (or any Cursor agent/bot) as git author, committer, or in a Co-authored-by / similar trailer.
