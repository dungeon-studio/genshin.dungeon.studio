---
description: Create or update documentation that passes Vale prose linting
agent: agent
argument-hint: File path under `docs/` and the topic to document
tools: ['editFiles', 'codebase', 'runInTerminal']
---

# Write documentation

Follow the documentation rules in
[Copilot instructions](../copilot-instructions.md).

Create or update a Markdown documentation file that conforms to the project's
Vale configuration and documentation principles.

## Inputs

- File path: `${input:filePath}` (relative to repo root, under `docs/`)
- Topic: `${input:topic}`

## Prose style rules

Write concise, factual, present-tense prose. Follow these Vale-enforced rules:

- **Contractions**: Always use contractions ("don't," "isn't," "can't"). The
  `Microsoft.Contractions` style requires them.
- **Em dashes**: Write em dashes without spaces (`word—word`). The
  `Microsoft.Dashes` style enforces this.
- **Latin abbreviations**: Write "for example" instead of "e.g." and "that's"
  instead of "i.e." The `Google.Latin` style flags Latin abbreviations.
- **Quotation punctuation**: Place commas and periods inside quotation marks
  ("like this," not outside).
- **Inclusive language**: The `alex` style checks for insensitive or
  exclusionary language.
- **Terminology**: Use project-accepted terms from
  `.styles/config/vocabularies/Project/accept.txt`. Use `pnpm` (not `npm` or
  `yarn`), and match exact capitalization for tool names.

## Document structure

1. Start with the SPDX header in HTML comment syntax:

   ```markdown
   <!--
   SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
   SPDX-License-Identifier: MIT
   -->
   ```

2. Add a level-1 heading (`#`) as the document title.
3. Use proper heading hierarchy (`##`, `###`)—don't skip levels.
4. Place the file in the correct `docs/` subdirectory following the
   [Diátaxis](https://diataxis.fr/) framework:
   - `docs/how-tos/` for task-oriented guides.
   - `docs/reference/` for lookup material.
   - `docs/explanation/` for background and rationale.

## Validation workflow

After writing or editing the file, run Vale and handle output in this order:

1. **Suggestions**: Review every suggestion one by one. Apply each one or make
   an explicit, reasoned decision not to apply it.
2. **Warnings**: Fix all warnings.
3. **Errors**: Fix all errors (these are commit-blocking).
4. If a valid product or tool name is flagged, add it to
   `.styles/config/vocabularies/Project/accept.txt` instead of rewriting.
5. Don't modify third-party Vale styles under `.styles/` (except
   `.styles/config/`).

Run validation:

```bash
pre-commit run vale --all-files
```

To check a single file without pre-commit overhead:

```bash
vale ${input:filePath}
```

## Cross-references

- Don't duplicate guidance that exists elsewhere—link to the canonical source.
- Link to `docs/reference/rest-api-conventions.md` for API design.
- Link to `docs/how-tos/add-spdx-headers.md` for SPDX details.
- Keep docs accurate to `HEAD`: verify dependencies, commands, and feature
  status before writing.
