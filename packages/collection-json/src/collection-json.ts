// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Collection+JSON media type types and utilities.
 *
 * Implements the Collection+JSON hypermedia type by Mike Amundsen.
 * Spec: http://amundsen.com/media-types/collection/format/
 * IANA registration: application/vnd.collection+json
 *
 * This module has no framework dependencies. Representation modules
 * for other media types (HAL, Siren, etc.) can follow the same pattern.
 */

export const COLLECTION_JSON = 'application/vnd.collection+json';

// --- Types ---

export type DatumValue = string | number | boolean | null;

/**
 * One name-value pair, in an item's data or in a write template.
 *
 * `value` is optional because a template datum names a field the client may
 * write and carries no value of its own. The same type serves both positions,
 * so a reader of an item's data still has to allow for an absent value.
 */
export interface Datum {
  name: string;
  value?: DatumValue;
  prompt?: string;
}

export interface Link {
  rel: string;
  href: string;
  name?: string;
  render?: 'image' | 'link';
  prompt?: string;
}

export interface Item {
  href: string;
  data: Datum[];
  links?: Link[];
}

export interface Query {
  rel: string;
  href: string;
  name?: string;
  prompt?: string;
  data?: Datum[];
}

export interface Template {
  data: Datum[];
}

export interface Collection {
  version: '1.0';
  href: string;
  links?: Link[];
  items: Item[];
  queries?: Query[];
  template?: Template;
}

/**
 * A whole Collection+JSON response body.
 *
 * The media type puts everything under a single `collection` key, so this
 * wrapper is the thing that goes on the wire and `Collection` never appears at
 * the top level on its own.
 */
export interface CollectionDocument {
  collection: Collection;
}

// --- Representation contract ---

/**
 * Core contract for mapping a domain type to Collection+JSON.
 *
 * Instances define the minimal data needed: how to serialise/deserialise
 * individual items, and an optional template for write affordances.
 * The generic serialiseCollection function handles the envelope.
 */
export interface CollectionJsonRepresentation<T> {
  serialise: (entity: T, baseUrl: string) => Item;
  deserialise: (item: Item) => T;
  template?: Template;
}

/**
 * Wrap pre-built Items into a CollectionDocument envelope.
 *
 * Reads the template from the representation so each resource module
 * only declares data, not envelope-wrapping behaviour.
 */
export function serialiseCollection<T>(
  repr: CollectionJsonRepresentation<T>,
  href: string,
  items: Item[],
): CollectionDocument {
  return buildCollection(href, items, { template: repr.template });
}

// --- Assertions ---

/**
 * Runtime check that an unknown value conforms to the CollectionDocument envelope.
 *
 * Validates that `value` has a `collection` object whose `items` property is an
 * array. Individual item shapes are left to domain-level deserialisers.
 *
 * @throws TypeError when the envelope is missing or malformed.
 */
export function assertCollectionDocument(value: unknown): asserts value is CollectionDocument {
  const doc = value as Record<string, unknown> | null | undefined;
  const collection = doc?.collection as Record<string, unknown> | undefined;
  if (!collection || !Array.isArray(collection.items)) {
    throw new TypeError('Expected a Collection+JSON document with collection.items array');
  }
}

// --- Builders ---

/**
 * Assembles one item, leaving out an empty `links` rather than emitting `[]`.
 *
 * An empty array and an absent key mean the same thing to a client, so omitting
 * it keeps a document diff to the fields that actually changed.
 */
export function buildItem(href: string, data: Datum[], links?: Link[]): Item {
  const item: Item = { href, data };
  if (links && links.length > 0) {
    item.links = links;
  }
  return item;
}

/**
 * Assembles the envelope, stamping the media type's version.
 *
 * Each optional part is left out when empty, on the same reasoning as
 * `buildItem`. Reach for `serialiseCollection` instead when a representation
 * already carries the template.
 */
export function buildCollection(
  href: string,
  items: Item[],
  options?: {
    template?: Template;
    queries?: Query[];
    links?: Link[];
  },
): CollectionDocument {
  const collection: Collection = {
    version: '1.0',
    href,
    items,
  };

  if (options?.template) {
    collection.template = options.template;
  }
  if (options?.queries && options.queries.length > 0) {
    collection.queries = options.queries;
  }
  if (options?.links && options.links.length > 0) {
    collection.links = options.links;
  }

  return { collection };
}
