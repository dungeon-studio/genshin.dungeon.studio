// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { RuleTester } from 'eslint';

import { redactedLogKeys } from './redacted-log-keys.js';
import { SENSITIVE_KEYS } from '../src/sensitive-keys.ts';

const options = [{ keys: SENSITIVE_KEYS }];

/**
 * @param {string} code
 * @param {...{ messageId: string, data: { name: string } }} errors
 */
const invalid = (code, ...errors) => ({ code, options, errors });

/** @param {string} name */
const unredacted = (name) => ({ messageId: 'unredactedValue', data: { name } });

new RuleTester().run('redacted-log-keys', redactedLogKeys, {
  valid: [
    'logger.info({ uid }, "signed in")',
    'logger.info({ email: address }, "signed in")',
    'logger.info({ request: { token } }, "nested once")',
    'logger.info({ user: { profile: claims } }, "under a redacted container")',
    'logger.child({ user })',
    'c.get("logger").error({ err: error }, "request failed")',
    'logger.info({ port }, "starting server")',
    'audit.info({ id: uid })',
  ].map((code) => ({ code, options })),

  invalid: [
    invalid('logger.info({ id: uid })', unredacted('uid')),
    invalid('logger.info({ subject: claims.uid })', unredacted('uid')),
    invalid('logger.info({ ...user })', unredacted('user')),
    invalid('logger.info(user)', unredacted('user')),
    invalid('logger.info("token %s", idToken)', unredacted('idToken')),
    invalid('logger.info(`signed in as ${email}`)', unredacted('email')),
    invalid('c.get("logger").warn({ who: c.get("user") })', unredacted('user')),
    invalid('logger.child({ caller: { [authorization]: true } })', unredacted('authorization')),
    invalid('logger.info({ a: { b: { token } } })', {
      messageId: 'tooDeep',
      data: { name: 'token' },
    }),
  ],
});
