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
 * @param {import('eslint').Rule.Node} node
 * @param {string} method
 * @returns {boolean}
 */
function isMethodCall(node, method) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === method
  );
}

/**
 * The context lookup `c.get('<name>')`, returning the name it reads.
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {string | undefined}
 */
function contextKey(node) {
  if (!isMethodCall(node, 'get')) return undefined;
  const [argument] = node.arguments;
  return argument?.type === 'Literal' && typeof argument.value === 'string'
    ? argument.value
    : undefined;
}

/**
 * The process-wide `logger`, or the request-scoped `c.get('logger')`.
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {boolean}
 */
function isLogger(node) {
  return (node.type === 'Identifier' && node.name === 'logger') || contextKey(node) === 'logger';
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
     * Report every read of a sensitive name in an expression whose value is
     * logged as is.
     *
     * @param {import('eslint').Rule.Node} node
     */
    function scan(node) {
      if (node.type === 'Identifier') {
        if (sensitive.has(node.name)) {
          context.report({ node, messageId: 'unredactedValue', data: { name: node.name } });
        }
        return;
      }

      const lookedUp = contextKey(node);
      if (lookedUp !== undefined && sensitive.has(lookedUp)) {
        context.report({ node, messageId: 'unredactedValue', data: { name: lookedUp } });
      }

      for (const field of visitorKeys[node.type] ?? []) {
        // A plain key is a name the line emits, not a value read into it.
        if (node.type === 'Property' && field === 'key' && !node.computed) continue;

        const children = [/** @type {Record<string, unknown>} */ (node)[field]].flat();
        for (const child of children) {
          if (child && typeof child === 'object' && 'type' in child) {
            scan(/** @type {import('eslint').Rule.Node} */ (child));
          }
        }
      }
    }

    /**
     * @param {import('eslint').Rule.Node} object
     * @param {number} depth
     */
    function checkMergingObject(object, depth) {
      for (const property of object.properties) {
        if (property.type === 'SpreadElement') {
          scan(property.argument);
          continue;
        }
        if (property.computed) scan(property.key);

        const name = staticKeyName(property);
        if (name !== undefined && sensitive.has(name)) {
          if (depth > REDACTED_DEPTH) {
            context.report({ node: property.key, messageId: 'tooDeep', data: { name } });
          }
          continue;
        }

        if (property.value.type === 'ObjectExpression') {
          checkMergingObject(property.value, depth + 1);
        } else {
          scan(property.value);
        }
      }
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression' || node.callee.computed) return;
        const { object, property } = node.callee;
        if (property.type !== 'Identifier' || !LOG_METHODS.has(property.name)) return;
        if (!isLogger(object)) return;

        const [first, ...rest] = node.arguments;
        if (first?.type === 'ObjectExpression') {
          checkMergingObject(first, 1);
        } else if (first !== undefined) {
          scan(first);
        }
        rest.forEach(scan);
      },
    };
  },
};
