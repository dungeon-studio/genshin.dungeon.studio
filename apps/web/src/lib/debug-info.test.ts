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
  it('renders the version and build sha together', () => {
    expect(formatDebugInfo(info)).toContain('App version: 0.1.0 (d4fbd16)');
  });

  it('renders authentication as yes/no without identifying the user', () => {
    const anon = formatDebugInfo({ ...info, authenticated: false });
    const signedIn = formatDebugInfo({ ...info, authenticated: true });

    expect(anon).toContain('Authenticated: no');
    expect(signedIn).toContain('Authenticated: yes');
    expect(signedIn).not.toContain('uid');
  });

  it('includes every requested environment detail', () => {
    const text = formatDebugInfo(info);

    expect(text).toContain('Game data: 5.3');
    expect(text).toContain('Screen: 1920×1080 @2x');
    expect(text).toContain('Platform: Linux x86_64');
    expect(text).toContain('User agent: Mozilla/5.0 (X11; Linux x86_64)');
  });
});

describe('buildBugReportUrl', () => {
  it('pre-fills the template, page url, and environment fields', () => {
    const url = new URL(
      buildBugReportUrl('https://github.com/o/r/issues/new', 'https://app.example/teams', info),
    );

    expect(url.searchParams.get('template')).toBe('bug-report.yml');
    expect(url.searchParams.get('url')).toBe('https://app.example/teams');
    expect(url.searchParams.get('environment')).toBe(formatDebugInfo(info));
  });
});
