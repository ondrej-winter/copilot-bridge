# How this ruleset is structured + how to toggle modules

## Structure and ordering
- Files in `.clinerules/` are **active** rules.
- Rule files are ordered by the numeric prefix (e.g., `01-`, `02-`) to keep a consistent reading order.
- Each file should focus on a single theme (core standards, architecture, testing, etc.).

## Toggling modules
- To **disable** a rule set temporarily, move the file to `.clinerules-bank/`.
- To **enable** a rule set, move it back to `.clinerules/`.
- Keep filenames identical when moving between folders so history remains clear.

## Adding or updating rules
- Prefer **small, focused** rule files rather than large monoliths.
- Use **Must/Should** language for clarity and consistency.
- When adding a new module, update this README and ensure numbering remains sequential.

## Active modules
- `01-typescript-standards.md` - Naming, formatting, types, error handling, logging
- `02-architecture-guardrails.md` - Hexagonal architecture doctrine, adapter directory structure
- `03-testing-standards.md` - Testing pyramid, Jest/Mocha conventions
- `04-docs-and-adr.md` - README updates, ADR format, changelog notes
- `05-module-structure.md` - File organization, splitting rules, barrel exports
- `06-vscode-extension-patterns.md` - Extension lifecycle, commands, configuration API
- `07-repo-navigation.md` - Generic navigation guidelines for hexagonal architecture
- `08-pr-and-commit-hygiene.md` - PR size, commit messages, reviews
- `09-tooling-and-ci.md` - Local quality gate, CI expectations
- `10-http-api-security.md` - Localhost binding, error handling, validation patterns
- `11-documentation-standards.md` - Clear, concise TSDoc and comments

## Workflows
- `workflows/update-repo-navigation.md` - Generate project-specific navigation maps on demand

## Scope
These rules apply to TypeScript projects using hexagonal architecture, particularly VS Code extensions.

## Project-specific customization
For project-specific navigation and structure details:
1. Use the workflow in `workflows/update-repo-navigation.md` to generate a current map
2. Store project-specific documentation in `docs/` or the project root
3. Keep `.clinerules/` generic and portable across projects
