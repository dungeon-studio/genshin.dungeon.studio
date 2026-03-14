// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { buildCollection, buildItem, COLLECTION_JSON } from './collection-json.js';

describe('COLLECTION_JSON', () => {
  it('equals the IANA-registered media type', () => {
    expect(COLLECTION_JSON).toBe('application/vnd.collection+json');
  });
});

describe('buildItem', () => {
  it('returns an item with href and data', () => {
    const item = buildItem('http://example.com/items/1', [
      { name: 'id', value: '1' },
      { name: 'title', value: 'Test' },
    ]);

    expect(item).toEqual({
      href: 'http://example.com/items/1',
      data: [
        { name: 'id', value: '1' },
        { name: 'title', value: 'Test' },
      ],
    });
  });

  it('omits links when not provided', () => {
    const item = buildItem('http://example.com/items/1', []);

    expect(item).not.toHaveProperty('links');
  });

  it('omits links when empty array is provided', () => {
    const item = buildItem('http://example.com/items/1', [], []);

    expect(item).not.toHaveProperty('links');
  });

  it('includes links when provided', () => {
    const links = [{ rel: 'collection', href: 'http://example.com/items' }];
    const item = buildItem('http://example.com/items/1', [], links);

    expect(item.links).toEqual(links);
  });
});

describe('buildCollection', () => {
  it('returns a document with version 1.0', () => {
    const doc = buildCollection('http://example.com/items', []);

    expect(doc.collection.version).toBe('1.0');
  });

  it('sets href to the collection URI', () => {
    const doc = buildCollection('http://example.com/items', []);

    expect(doc.collection.href).toBe('http://example.com/items');
  });

  it('includes items in the collection', () => {
    const items = [
      buildItem('http://example.com/items/1', [{ name: 'id', value: '1' }]),
      buildItem('http://example.com/items/2', [{ name: 'id', value: '2' }]),
    ];
    const doc = buildCollection('http://example.com/items', items);

    expect(doc.collection.items).toHaveLength(2);
    expect(doc.collection.items).toEqual(items);
  });

  it('omits template when not provided', () => {
    const doc = buildCollection('http://example.com/items', []);

    expect(doc.collection).not.toHaveProperty('template');
  });

  it('includes template when provided', () => {
    const template = { data: [{ name: 'title', prompt: 'Enter title' }] };
    const doc = buildCollection('http://example.com/items', [], { template });

    expect(doc.collection.template).toEqual(template);
  });

  it('omits queries when not provided', () => {
    const doc = buildCollection('http://example.com/items', []);

    expect(doc.collection).not.toHaveProperty('queries');
  });

  it('omits queries when empty array is provided', () => {
    const doc = buildCollection('http://example.com/items', [], { queries: [] });

    expect(doc.collection).not.toHaveProperty('queries');
  });

  it('includes queries when provided', () => {
    const queries = [
      {
        rel: 'search',
        href: 'http://example.com/items',
        data: [{ name: 'q', prompt: 'Search' }],
      },
    ];
    const doc = buildCollection('http://example.com/items', [], { queries });

    expect(doc.collection.queries).toEqual(queries);
  });

  it('omits links when not provided', () => {
    const doc = buildCollection('http://example.com/items', []);

    expect(doc.collection).not.toHaveProperty('links');
  });

  it('omits links when empty array is provided', () => {
    const doc = buildCollection('http://example.com/items', [], { links: [] });

    expect(doc.collection).not.toHaveProperty('links');
  });

  it('includes links when provided', () => {
    const links = [{ rel: 'profile', href: 'http://example.com/schema' }];
    const doc = buildCollection('http://example.com/items', [], { links });

    expect(doc.collection.links).toEqual(links);
  });
});
