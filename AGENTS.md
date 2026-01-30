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
5) Run `bun test` (and `bun run build` if touching CLI/build code).
6) If anything fails, fix it and repeat steps 2-5 until green.

## Notes
- Formatting and linting are handled by Biome (`biome.json`).
- Use `bun run <script>` to avoid name collisions with Bun built-ins.
