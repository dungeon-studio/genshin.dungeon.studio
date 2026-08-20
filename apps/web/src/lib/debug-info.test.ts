// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { buildBugReportUrl, formatDebugInfo } from './debug-info';
import type { DebugInfo } from './debug-info';

const info: DebugInfo = {
  appVersion: '0.1.0',
  buildSha: 'd4fbd16',
  gameDataVersion: '5.3',
  authenticated: false,
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
  platform: 'Linux x86_64',
  screenWidth: 1920,
  screenHeight: 1080,
  pixelRatio: 2,
};

describe('formatDebugInfo', () => {
  it('reports authentication as yes/no', () => {
    expect(formatDebugInfo({ ...info, authenticated: false })).toContain('Authenticated: no');
    expect(formatDebugInfo({ ...info, authenticated: true })).toContain('Authenticated: yes');
  });

  it('carries every field a triager needs', () => {
    const text = formatDebugInfo(info);

    // Each value flows through so a report is self-contained; label wording is
    // not pinned.
    for (const value of ['0.1.0', 'd4fbd16', '5.3', '1920', '1080', 'Linux x86_64']) {
      expect(text).toContain(value);
    }
  });
});

describe('buildBugReportUrl', () => {
  it('keys prefill params to the bug-report template field ids', () => {
    // Wrong keys => GitHub silently drops the prefill, so the field ids are the
    // property under test.
    const url = new URL(
      buildBugReportUrl('https://github.com/o/r/issues/new', 'https://app.example/teams', info),
    );

    expect(url.searchParams.get('template')).toBe('bug-report.yml');
    expect(url.searchParams.get('url')).toBe('https://app.example/teams');
    expect(url.searchParams.get('environment')).toBe(formatDebugInfo(info));
  });
});
