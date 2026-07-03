// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export interface DebugInfo {
  appVersion: string;
  buildSha: string;
  gameDataVersion: string;
  route: string;
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
    `Route: ${info.route}`,
    `Authenticated: ${info.authenticated ? 'yes' : 'no'}`,
    `Screen: ${info.screenWidth}×${info.screenHeight} @${info.pixelRatio}x`,
    `Platform: ${info.platform}`,
    `User agent: ${info.userAgent}`,
  ].join('\n');
}
