// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export interface HeldResponse {
  resolver: () => Promise<Response>;
  /** Settles once the held request reaches its handler. */
  arrived: Promise<void>;
  release: () => void;
}

/** A response held back until `release()`, so a test can act while the request is in flight. */
export function holdResponse(respond: () => Response): HeldResponse {
  let send = (): void => {};
  const pending = new Promise<Response>((resolve) => {
    send = () => {
      resolve(respond());
    };
  });
  let arrive = (): void => {};
  const arrived = new Promise<void>((resolve) => {
    arrive = resolve;
  });

  return {
    resolver: () => {
      arrive();
      return pending;
    },
    arrived,
    release: () => {
      send();
    },
  };
}
