# Troubleshooting Common Issues

This guide helps you resolve common development issues.

## General Debugging Steps

1. Check test output for specific error messages
2. Review recent changes: `git diff`
3. Verify dependencies are installed: `pnpm install`
4. Check documentation in `docs/`
5. Search GitHub issues for similar problems

---

## "Module not found" Error

**Problem:** TypeScript or Node can't find a module.

**Solution:**

```bash
# Cross-platform solution - clean and reinstall
pnpm dlx rimraf node_modules pnpm-lock.yaml
pnpm install
```

**Also check:**

- Is the package listed in `package.json`?
- Are you using the correct import path?
- Did you restart the dev server after installing?

---

## "Port already in use" Error

**Problem:** The dev server can't start because the port is in use.

**Unix/Linux/macOS:**

```bash
# Kill frontend server (port 5173)
lsof -ti:5173 | xargs kill

# Kill backend server (port 8080)
lsof -ti:8080 | xargs kill
```

**Windows (PowerShell):**

```powershell
# Kill frontend
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process

# Kill backend
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process
```

**Windows (Command Prompt):**

```cmd
REM Kill frontend
for /f "tokens=5" %a in ('netstat -ano ^| findstr :5173') do taskkill /F /PID %a

REM Kill backend
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8080') do taskkill /F /PID %a
```

---

## "Test fails but code works" Issue

**Problem:** Tests fail in CI or locally, but the app runs fine.

**Check these:**

1. **Test setup:** Verify `src/test/setup.ts` is configured correctly
2. **Imports:** Use `@testing-library/react` not `@testing-library/react-native`
3. **Mocks:** Ensure mocks match actual implementations
4. **Async code:** Use `await` and proper async testing utilities
5. **Environment:** Tests may need environment variables

---

## Type Errors After Update

**Problem:** TypeScript shows errors after pulling new changes.

**Solution:**

```bash
# Rebuild TypeScript projects
pnpm build

# Or clean and rebuild
pnpm clean
pnpm install
pnpm build
```

---

## Still Stuck?

- Open a [GitHub Discussion](https://github.com/dungeon-studio/genshin.dungeon.studio/discussions)
- Check existing [GitHub Issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues)
- Review project documentation in `docs/`
