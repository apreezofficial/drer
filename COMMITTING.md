# Committing to AuraOS

Short conventions for commits in this repository.

## Message format

Use a type prefix, then a short lowercase summary:

```
<type>: <summary>
```

Common types used in this repo:

- `feat` — a new feature or subsystem
- `fix` — a bug fix
- `init` — project scaffolding
- `drivers` / `kernel` / `ai` / `shell` / `lib` — a change scoped to one area
- `docs` — documentation only

Examples from history:

```
kernel/memory: VMM — x86 two-level paging, identity-map first 8MB
ai: system context collector + inference engine (Groq + mock fallback)
```

## Guidelines

- Keep each commit to one logical change.
- Build before committing: `make` should succeed.
- Don't commit build artifacts (`*.o`, `*.elf`, `*.iso`) or local config.
- Don't commit API keys. `GROQ_API_KEY` is read from the environment only.
