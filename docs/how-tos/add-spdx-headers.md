<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# How to add SPDX headers to new files

This guide shows you how to add copyright and license headers to new source files.

---

## Quick reference by file type

| File Type                                    | Header Format | Example                                                                  |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| TypeScript/JavaScript (.ts, .tsx, .js, .jsx) | `//`          | `// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>`       |
| CSS/SCSS (.css, .scss)                       | `//`          | `// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>`       |
| Markdown (.md)                               | `<!--` HTML   | `<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->` |
| YAML/INI (.yaml, .yml, .ini)                 | `#`           | `# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>`        |
| HTML (.html)                                 | `<!--` HTML   | `<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->` |
| SVG (.svg)                                   | `<!--` XML    | `<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->` |
| Shell (.sh, .bash)                           | `#`           | `# SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>`        |

---

## Step-by-step

### 1. Add to top of file

Place the SPDX header at the very beginning of the file (line 1), before any code or other comments.

**Two required lines:**

```text
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
```

### 2. Use correct comment syntax

Wrap with your file type's comment syntax. For TypeScript:

```typescript
// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT
```

For Markdown:

```markdown
<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->
```

### 3. Verify with reuse lint

After adding headers, verify compliance:

```bash
pnpm reuse:check
```

Should output: `Congratulations! Your project is compliant with version 3.3 of the REUSE Specification`
