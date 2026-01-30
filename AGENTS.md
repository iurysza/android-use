# AGENTS.md

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
