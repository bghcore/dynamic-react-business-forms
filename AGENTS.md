# AGENTS.md -- Dynamic React Business Forms

## Setup

```bash
npm install --legacy-peer-deps
npm run build          # Build all packages (core then fluent)
npm run clean          # Remove all dist/ directories
```

Build individual packages:

```bash
npm run build:core     # packages/core only
npm run build:fluent   # packages/fluent only
```

## Project Structure

Monorepo using npm workspaces:

```
packages/
  core/    -- @bghcore/dynamic-forms-core (React + react-hook-form only, NO UI library)
  fluent/  -- @bghcore/dynamic-forms-fluent (Fluent UI v9 field components)
```

Build output per package: `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types). Built with tsup.

## Code Style

- Components use `Hook` prefix: `HookTextbox`, `HookDropdown`, `HookInlineForm`
- Read-only variants: `HookReadOnly` prefix in `fields/readonly/`
- Interfaces use `I` prefix: `IFieldConfig`, `IBusinessRule`, `IHookFieldSharedProps`
- Providers export both the component and a `Use*Context` hook
- Use `React.JSX.Element` not bare `JSX.Element`
- camelCase for variables/functions, PascalCase for components/types
- Field components receive `IHookFieldSharedProps<T>` via `React.cloneElement`
- Business rule actions follow Redux action pattern (type enum + payload)
- No lodash -- use local utilities from `utils/index.ts`
- Use `structuredClone` for deep copies (not `JSON.parse(JSON.stringify(...))`)

## Testing

No test suite exists yet. Planned for a future release.

## Build Verification

After any code change, verify:

```bash
npm run build
```

Both packages should build cleanly. Check that `packages/core/dist/` and `packages/fluent/dist/` each contain `index.js`, `index.cjs`, and `index.d.ts`.

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Single `main` branch
- Run `npm run build` before committing to catch type errors

## Boundaries

### Always OK

- Reading any file in the repo
- Running `npm run build`, `npm run clean`
- Editing source files in `packages/core/src/` and `packages/fluent/src/`
- Creating or editing tests
- Updating documentation (README, CHANGELOG, CLAUDE.md, AGENTS.md)

### Ask First

- Adding new npm dependencies
- Changing `tsconfig` or `tsup.config.ts` settings
- Modifying `package.json` exports, peerDependencies, or version numbers
- Renaming or removing public API exports
- Structural changes (new packages, moving files between packages)
- Running `npm publish`

### Never

- Running `rm -rf` on anything outside `dist/` directories
- Force-pushing to `main`
- Committing `.env` files or secrets
- Adding `@fluentui/*` dependencies to the core package
