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

Use the repo-local blog skills in `.codex/skills/`:
- `/blog-new` to scaffold a new post
- `/blog-review` to audit frontmatter, filenames, tags, and references
- `/blog-deploy` to commit, push, and trigger deployment
- `/project-showcase` to score project-heavy posts for the tech-radar page

Follow the blog workflow in `README.md` and `AGENTS.md` when editing posts:
create the file under `blog/`, keep the frontmatter complete, preview locally with `npm run start`, then deploy with `npm run deploy` or `/blog-deploy`.

### Local permissions

The repo-local automation allowlist has been migrated into `reasonix.toml`:
`git status`, `git add`, `git commit`, `git push`, and `npm run`.

## Notes

- Keep `docs/` for documentation pages, not blog posts.
- Prefer existing project conventions over inventing new ones.
