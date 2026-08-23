// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * What a bug report says about the reporter's build and browser.
 *
 * Every field ends up in a public issue, so nothing identifying belongs here:
 * `authenticated` records that someone was signed in, never who.
 */
export interface DebugInfo {
  appVersion: string;
  buildSha: string;
  gameDataVersion: string;
  authenticated: boolean;
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

export function formatDebugInfo(info: DebugInfo): string {
  return [
    `App version: ${info.appVersion} (${info.buildSha})`,
    `Game data: ${info.gameDataVersion}`,
    `Authenticated: ${info.authenticated ? 'yes' : 'no'}`,
    `Screen: ${info.screenWidth}×${info.screenHeight} @${info.pixelRatio}x`,
    `Platform: ${info.platform}`,
    `User agent: ${info.userAgent}`,
  ].join('\n');
}

/**
 * Build a GitHub bug-report URL with the reporter's page and environment
 * pre-filled. The `url` and `environment` keys match field ids in
 * `.github/ISSUE_TEMPLATE/bug-report.yml`; GitHub issue forms pre-fill any
 * field addressed by its id through a query parameter.
 */
export function buildBugReportUrl(newIssueUrl: string, pageUrl: string, info: DebugInfo): string {
  const params = new URLSearchParams({
    template: 'bug-report.yml',
    url: pageUrl,
    environment: formatDebugInfo(info),
  });

  return `${newIssueUrl}?${params.toString()}`;
}
