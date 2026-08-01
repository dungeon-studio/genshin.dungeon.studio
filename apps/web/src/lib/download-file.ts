// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * A synthetic anchor is the only way to name a downloaded blob. The object URL
 * is released straight after the click because the browser has taken its own
 * reference by then.
 */
export function downloadFile(filename: string, contents: string, mediaType: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mediaType }));

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
