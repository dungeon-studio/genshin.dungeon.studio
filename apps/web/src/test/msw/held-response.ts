// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export interface HeldResponse {
  /** Pass as the handler's resolver; the request stays in flight until `release()`. */
  resolver: () => Promise<Response>;
  release: () => void;
}

/** A response the test sends when it chooses, to act while the request is in flight. */
export function holdResponse(respond: () => Response): HeldResponse {
  let send = (): void => {};
  const pending = new Promise<Response>((resolve) => {
    send = () => {
      resolve(respond());
    };
  });

  return {
    resolver: () => pending,
    release: () => {
      send();
    },
  };
}
