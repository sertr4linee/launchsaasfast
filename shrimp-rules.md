# Development Guidelines

## Project Architecture

- Recursively review all folders and files in the project before making changes.
- Main directories: `application/`, `application/app/`, `application/public/`.
- Key files: `package.json`, `tsconfig.json`, `next.config.ts`, `README.md`, `globals.css`, `layout.tsx`, `page.tsx`.

## Code Standards

- Use the existing file's indentation and formatting style when editing.
- File and folder names must remain consistent with the current structure.
- Do not introduce new naming conventions unless required by a new feature.
- Add comments only when clarifying non-obvious logic.

## Functionality Implementation Standards

- When adding new features, place new files in the most relevant directory (e.g., UI in `app/`, assets in `public/`).
- When modifying a feature, update all related files (e.g., if changing a component, update its usage in `layout.tsx` and `page.tsx` if necessary).
- Always update `README.md` if the change affects project setup or usage.

## Framework/Plugin/Third-party Library Usage Standards

- Only add dependencies to `package.json` if not already present.
- When updating dependencies, ensure compatibility with `tsconfig.json` and `next.config.ts`.
- Do not remove or downgrade existing dependencies unless explicitly required.

## Workflow Standards

- Always check for related files that require simultaneous updates (e.g., config files, documentation).
- When editing configuration files, verify that all dependent files are updated accordingly.
- Use imperative commit messages describing the change (e.g., "Update layout for new navigation").

## Key File Interaction Standards

- If modifying `README.md`, also update any related documentation in the project.
- When changing `globals.css`, check for style dependencies in all components.
- If editing `next.config.ts`, verify that changes do not break the build or deployment process.

## AI Decision-making Standards

- Prioritize updating files that have direct dependencies on the change.
- If ambiguity exists, prefer minimal, localized changes over broad refactoring.
- When in doubt, review all related files for potential impact before proceeding.
- Use the following decision tree:
  1. Does the change affect multiple files? If yes, list all affected files and update them together.
  2. Is the change configuration-related? If yes, check for downstream effects in the build and runtime.
  3. Is documentation impacted? If yes, update `README.md` and any other relevant docs.

## Prohibited Actions

- Do not include general development knowledge or explanations of project functionality.
- Do not modify files outside the project root or unrelated directories.
- Do not introduce breaking changes without updating all affected files.
- Do not add, remove, or rename files/folders unless required by a specific task.
- Do not seek user clarification for ambiguous requests; instead, analyze the codebase and infer the best course of action.

## Examples

**Allowed:**
- Update `layout.tsx` and `globals.css` together when changing the site layout.
- Add a new SVG to `public/` and reference it in `page.tsx`.

**Prohibited:**
- Adding general TypeScript or Next.js usage tips.
- Modifying unrelated files when fixing a bug in a specific component.
- Removing dependencies from `package.json` without a clear reason.

**Warning:**
- **Always** check for multi-file dependencies before making changes.
- **Never** include general programming advice or project explanations in this document.
