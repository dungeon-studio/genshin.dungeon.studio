// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/** The pino methods whose arguments end up in a log line. */
const LOG_METHODS = new Set(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'child']);

/**
 * How many levels of the merging object the logger's redaction paths reach:
 * `key` and `*.key`.
 */
const REDACTED_DEPTH = 2;

/**
 * The method a call such as `receiver.method(...)` invokes.
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {string | undefined}
 */
function calledMethod(node) {
  if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression') return undefined;
  const { computed, property } = node.callee;
  return !computed && property.type === 'Identifier' ? property.name : undefined;
}

/**
 * The name a context lookup `c.get('<name>')` reads.
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {string | undefined}
 */
function contextLookup(node) {
  if (calledMethod(node) !== 'get') return undefined;
  const [argument] = node.arguments;
  return argument?.type === 'Literal' && typeof argument.value === 'string'
    ? argument.value
    : undefined;
}

/**
 * The name a node reads its value from: a variable or property, or a context
 * lookup.
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {string | undefined}
 */
function readName(node) {
  return node.type === 'Identifier' ? node.name : contextLookup(node);
}

/**
 * The process-wide `logger`, or the request-scoped `c.get('logger')`.
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {boolean}
 */
function isLogger(node) {
  return readName(node) === 'logger';
}

/**
 * @param {import('eslint').Rule.Node} property
 * @returns {string | undefined}
 */
function staticKeyName(property) {
  if (property.computed) return undefined;
  if (property.key.type === 'Identifier') return property.key.name;
  return property.key.type === 'Literal' ? String(property.key.value) : undefined;
}

/**
 * @param {import('eslint').Rule.Node} node
 * @param {import('eslint').SourceCode['visitorKeys']} visitorKeys
 * @returns {Generator<import('eslint').Rule.Node>}
 */
function* childNodes(node, visitorKeys) {
  for (const field of visitorKeys[node.type] ?? []) {
    for (const child of [/** @type {Record<string, unknown>} */ (node)[field]].flat()) {
      if (child && typeof child === 'object' && 'type' in child) {
        yield /** @type {import('eslint').Rule.Node} */ (child);
      }
    }
  }
}

/** @type {import('eslint').Rule.RuleModule} */
export const redactedLogKeys = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Reject log calls that carry a sensitive identifier somewhere the redaction paths do not reach',
    },
    schema: [
      {
        type: 'object',
        properties: { keys: { type: 'array', items: { type: 'string' } } },
        required: ['keys'],
        additionalProperties: false,
      },
    ],
    messages: {
      unredactedValue:
        '`{{ name }}` is sensitive but is logged outside a redacted key. Log it under `{{ name }}`, or leave it out.',
      tooDeep:
        '`{{ name }}` is nested deeper than redaction reaches (the top level and one below). Move it up, or leave it out.',
    },
  },

  create(context) {
    const [{ keys }] = /** @type {[{ keys: string[] }]} */ (context.options);
    const sensitive = new Set(keys);
    const { visitorKeys } = context.sourceCode;

    /**
     * @param {import('eslint').Rule.Node} node
     * @param {'unredactedValue' | 'tooDeep'} messageId
     * @param {string} name
     */
    const report = (node, messageId, name) => context.report({ node, messageId, data: { name } });

    /**
     * Report every read of a sensitive name in an expression whose value is
     * logged as is.
     *
     * @param {import('eslint').Rule.Node} node
     */
    function reportReads(node) {
      // A plain key is a name the line emits, not a value read into it.
      if (node.type === 'Property' && !node.computed) {
        reportReads(node.value);
        return;
      }

      const name = readName(node);
      if (name !== undefined && sensitive.has(name)) report(node, 'unredactedValue', name);

      for (const child of childNodes(node, visitorKeys)) reportReads(child);
    }

    /**
     * Check a value pino merges into the line: an object literal's keys are
     * redacted down to `REDACTED_DEPTH`, anything else is logged as is.
     *
     * @param {import('eslint').Rule.Node} node
     * @param {number} depth - the level the node's own keys sit at.
     */
    function checkLogged(node, depth) {
      if (node.type !== 'ObjectExpression') {
        reportReads(node);
        return;
      }
      for (const property of node.properties) checkMergedProperty(property, depth);
    }

    /**
     * @param {import('eslint').Rule.Node} property
     * @param {number} depth
     */
    function checkMergedProperty(property, depth) {
      if (property.type === 'SpreadElement') {
        reportReads(property.argument);
        return;
      }
      if (property.computed) reportReads(property.key);

      const name = staticKeyName(property);
      if (name === undefined || !sensitive.has(name)) {
        checkLogged(property.value, depth + 1);
        return;
      }
      if (depth > REDACTED_DEPTH) report(property.key, 'tooDeep', name);
    }

    return {
      CallExpression(node) {
        const method = calledMethod(node);
        if (method === undefined || !LOG_METHODS.has(method)) return;
        if (!isLogger(node.callee.object)) return;

        const [merged, ...rest] = node.arguments;
        if (merged !== undefined) checkLogged(merged, 1);
        rest.forEach(reportReads);
      },
    };
  },
};
