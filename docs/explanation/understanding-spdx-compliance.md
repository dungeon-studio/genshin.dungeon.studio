<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Understanding SPDX compliance: Headers vs `REUSE.toml`

This project uses the [REUSE Specification v3.3](https://reuse.software/spec-3.3/) to make copyright and licensing information machine-readable and comply with open source best practices. Both SPDX headers and the `REUSE.toml` file serve the same goal through different mechanisms, each suited to different file types.

---

## Two approaches to REUSE compliance

### 1. SPDX headers (preferred for source files)

SPDX headers are copyright/license declarations embedded directly in source files as comments.

**Where used:**

- TypeScript, JavaScript, CSS, Markdown, HTML, SVG, YAML, shell scripts
- Any file type that supports comment syntax

**Example (TypeScript):**

```typescript
// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export function myFunction() { ... }
```

**Why this approach:**

- Copyright info travels with the code through refactors and forks
- Verification is straightforward by reading the file directly
- Scales better than external declarations as files multiply
- Required for compliance by most open source guidelines

---

### 2. `REUSE.toml` for files without comment support

[`REUSE.toml`](https://reuse.software/spec-3.3/#reusetoml) allows declaring copyright/license for files that **can't have comment syntax**.

**Where used:**

- Standard JSON config files (`package.json`, `tsconfig.json`, etc.) - pure JSON doesn't support comments
- Package managers (`pnpm-lock.yaml`)
- Generated/build files (`.turbo/`, `dist/`, `node_modules/`)
- Binary or non-standard files

**Note** that files that support JSON-with-comments (JSONC), such as `.vscode/*.json` and `.devcontainer/devcontainer.json`, can have SPDX headers directly using `//` comment syntax.

**Example entry in `REUSE.toml`:**

```toml
[[annotations]]
path = ["**.json", ".prettierrc"]
precedence = "aggregate"
SPDX-FileCopyrightText = "2026 Alex Brandt <alunduil@gmail.com>"
SPDX-License-Identifier = "MIT"
```

**Why this approach:**

- Avoids breaking JSON syntax by injecting comments
- Centralizes declarations for multiple files with identical copyright
- Reduces noise in auto generated/vendor files

---

## See also

- [How to add SPDX headers to new files](../how-tos/add-spdx-headers.md): practical steps for adding headers and troubleshooting
- [REUSE Specification v3.3](https://reuse.software/spec-3.3/)
