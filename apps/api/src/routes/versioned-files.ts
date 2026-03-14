// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Context } from 'hono';
import { Hono } from 'hono';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { compare, valid } from 'semver';

const srcDir = resolve(new URL('.', import.meta.url).pathname, '..');

export function createVersionedFileRoutes(options: {
  contentType: string;
  /** Directory containing versioned files, relative to `apps/api/src/`. */
  directory: string;
}): Hono {
  const files = loadVersionedFiles(join(srcDir, options.directory));
  const router = new Hono();
  const prefix = `/${options.directory}/`;

  router.get('/*', (c) => {
    const relativePath = c.req.path.slice(prefix.length);

    return (
      serveExactVersion(c, files, relativePath, options.contentType) ??
      redirectToLatestVersion(c, files, relativePath, prefix)
    );
  });

  return router;
}

function serveExactVersion(
  c: Context,
  files: Map<string, string>,
  path: string,
  contentType: string,
): Response | undefined {
  const content = files.get(path);
  if (!content) {
    return undefined;
  }
  return c.body(content, { headers: { 'Content-Type': contentType } });
}

function redirectToLatestVersion(
  c: Context,
  files: Map<string, string>,
  path: string,
  prefix: string,
): Response | Promise<Response> {
  if (!path.endsWith('.json')) {
    return c.notFound();
  }

  const name = path.slice(0, -'.json'.length);
  const latest = latestVersion(files, `${name}/`);

  if (!latest) {
    return c.notFound();
  }

  return c.redirect(`${prefix}${name}/${latest}.json`, 302);
}

function loadVersionedFiles(baseDir: string): Map<string, string> {
  const files = new Map<string, string>();

  let modules: string[];
  try {
    modules = readdirSync(baseDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return files;
  }

  for (const module of modules) {
    const modulePath = join(baseDir, module);
    const children = readdirSync(modulePath, { withFileTypes: true });

    for (const child of children) {
      if (child.isDirectory()) {
        // Schema: module/name/version.json
        const namePath = join(modulePath, child.name);
        const versions = readdirSync(namePath).filter((f) => f.endsWith('.json'));
        for (const versionFile of versions) {
          const key = `${module}/${child.name}/${versionFile}`;
          files.set(key, readFileSync(join(namePath, versionFile), 'utf-8'));
        }
      } else if (child.name.endsWith('.json')) {
        // Profile: module/version.json
        const key = `${module}/${child.name}`;
        files.set(key, readFileSync(join(modulePath, child.name), 'utf-8'));
      }
    }
  }

  return files;
}

function latestVersion(files: Map<string, string>, prefix: string): string | undefined {
  const versions = [...files.keys()]
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length).replace('.json', ''))
    .filter((v) => valid(v) !== null)
    .sort(compare);
  return versions.at(-1);
}
