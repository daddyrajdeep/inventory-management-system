# Team Workflow

## Branches
- `main` is protected. Nobody pushes to it directly.
- Create one branch per feature from the latest main:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/<short-name>
  ```
- Naming: `feature/products-crud`, `fix/login-error`, `docs/readme-update`.

## Commits
Small, clear commits with a prefix:
- `feat: add product create API`
- `fix: stop negative stock on sale`
- `docs: update README setup steps`
- `chore: install recharts`

## Pull requests
1. Push your branch: `git push origin feature/<short-name>`
2. Open a Pull Request on GitHub and fill in the template.
3. The leader (or another teammate) reviews. Fix requested changes.
4. After approval, merge, then update your local main:
   ```bash
   git checkout main
   git pull origin main
   ```

## Keep your branch up to date
Before opening a PR, bring in the latest main:
```bash
git fetch origin
git merge origin/main
```
Resolve conflicts in VS Code, test, then commit.

## Rules
- Never commit `.env` or any password or connection string.
- Stock quantity changes only through the stock service (it also writes a StockMovement).
- Every route that changes data must check the user's role.
- Keep PRs small: one feature per PR.
- Run the app before opening a PR. It must start without errors.
