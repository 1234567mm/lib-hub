<!-- codebase-memory-mcp:start -->
# Codebase Knowledge Graph (codebase-memory-mcp)

This project uses codebase-memory-mcp to maintain a knowledge graph of the codebase.
ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.

## Priority Order
1. `search_graph` - find functions, classes, routes, variables by pattern
2. `trace_path` - trace who calls a function or what it calls
3. `get_code_snippet` - read specific function/class source code
4. `query_graph` - run Cypher queries for complex patterns
5. `get_architecture` - high-level project summary

## When to fall back to grep/glob
- Searching for string literals, error messages, config values
- Searching non-code files (Dockerfiles, shell scripts, configs)
- When MCP tools return insufficient results

## Examples
- Find a handler: `search_graph(name_pattern=".*OrderHandler.*")`
- Who calls it: `trace_path(function_name="OrderHandler", direction="inbound")`
- Read source: `get_code_snippet(qualified_name="pkg/orders.OrderHandler")`
<!-- codebase-memory-mcp:end -->

# lib-hub

This is a Docusaurus 3.7.0 personal tech blog deployed to GitHub Pages.
Blog posts live in `blog/` as `YYYY-MM-DD-slug.md`; docs pages live in `docs/`.

## Agent skills

### Blog publishing

Use the repo-local blog skills in `.codex/skills/` (this is the single source of truth;
`.zcode/skills/` is a set of NTFS junctions pointing at it for ZCode discovery — edit
`.codex/skills/` only, never duplicate files between the two):
- `/blog-new` to scaffold a new post, 行业动态 topic, or tech-radar featured project
- `/blog-review` to audit frontmatter, filenames, tags, and references
- `/blog-deploy` to commit, push, and trigger deployment
- `/project-showcase` to score project-heavy posts for the tech-radar page

Follow the blog workflow in `README.md` and `AGENTS.md` when editing posts:
create the file under `blog/`, keep the frontmatter complete, preview locally with `npm run start`, then deploy with `npm run deploy` or `/blog-deploy`.

### Local permissions

The repo-local automation allowlist lives in `reasonix.toml` `[permissions] allow`.
It covers the publishing flow in both shell forms (bare and `cd <repo> && …`):
`git status/add/commit/push`, `npm run`, read-only `git diff/log/show`,
the exact `git checkout -- reasonix.toml` restore, and `uv run` for script checks.
If a new command keeps getting auto-appended here, add a matching pattern instead
of letting literal entries accumulate.

### Mimosa security gate

The Mimosa plugin scans file writes and `git commit/push`. Real findings must be
fixed in code (never bypass with `--no-verify`); coexistence rules, ledger reading,
and known false-positive patterns (e.g. Python `open(path, 'w')` — use
`pathlib.write_text`) are documented in `.codex/skills/blog-deploy/SKILL.md`.

## Notes

- Keep `docs/` for documentation pages, not blog posts.
- Prefer existing project conventions over inventing new ones.
