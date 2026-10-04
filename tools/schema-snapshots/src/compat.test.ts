// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkSnapshotCompat } from './compat.js';

const APP_SNAPSHOT = 'apps/api/schema-snapshots/characters/v0.json';
const PACKAGE_SNAPSHOT = 'packages/domain/schema-snapshots/export/v1.json';

const STRING = JSON.stringify({ type: 'string' });
const SHORT_STRING = JSON.stringify({ type: 'string', maxLength: 3 });
const STRING_OR_NUMBER = JSON.stringify({ type: ['string', 'number'] });

let repo: string;

function write(path: string, contents: string): void {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), contents);
}

function git(...args: string[]): void {
  execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args], {
    cwd: repo,
    stdio: 'ignore',
  });
}

describe('checkSnapshotCompat', () => {
  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), 'schema-snapshots-'));
    git('init', '--quiet');
    write(APP_SNAPSHOT, STRING);
    write(PACKAGE_SNAPSHOT, STRING);
    git('add', '.');
    git('-c', 'commit.gpgsign=false', 'commit', '--quiet', '--message', 'base');
  });

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('passes a tree that matches its base', () => {
    expect(checkSnapshotCompat(repo, 'HEAD')).toEqual([]);
  });

  it('passes a widened schema', () => {
    write(APP_SNAPSHOT, STRING_OR_NUMBER);

    expect(checkSnapshotCompat(repo, 'HEAD')).toEqual([]);
  });

  it('rejects a narrowed schema in an app', () => {
    write(APP_SNAPSHOT, SHORT_STRING);

    const violations = checkSnapshotCompat(repo, 'HEAD');

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/^apps\/api\/schema-snapshots\/characters\/v0\.json narrows/);
  });

  it('rejects a narrowed schema in a package nobody registered', () => {
    write(PACKAGE_SNAPSHOT, SHORT_STRING);

    const violations = checkSnapshotCompat(repo, 'HEAD');

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/^packages\/domain\/schema-snapshots\/export\/v1\.json narrows/);
  });

  it('rejects a deleted snapshot the base shipped', () => {
    rmSync(join(repo, PACKAGE_SNAPSHOT));

    const violations = checkSnapshotCompat(repo, 'HEAD');

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/export v1 in its schema registry/);
  });
});
