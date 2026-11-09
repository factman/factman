# Contributing

## Workflow: trunk-based

- `main` is the trunk and is always releasable. Nobody pushes to it directly.
- Work on short-lived branches (a day or two), one per Linear issue. Use the branch name Linear gives you, for example `factman60/ete-17-code-quality-hooks-prettier-editorconfig`. Linear links the PR to the issue from the branch name.
- Open a pull request early, keep it small, and merge once CI is green. Rebase on `main` instead of merging `main` into the branch, so history stays linear.

## Local setup

```bash
nvm install && nvm use   # Node from .nvmrc
corepack enable          # pnpm version from package.json
pnpm install             # also installs the git hooks (husky)
```

## Git hooks

| Hook         | What runs                                                  |
| ------------ | ---------------------------------------------------------- |
| `pre-commit` | `lint-staged`: Prettier and ESLint on staged files         |
| `commit-msg` | `commitlint`: the message must follow Conventional Commits |

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Reference the Linear issue in the footer, for example `Refs: ETE-17`.

## Pull requests

Fill in the PR template, including the requirement IDs (for example FR-01) and the Linear issue the change covers.

## Formatting

```bash
pnpm format         # write
pnpm format:check   # verify (CI)
```
