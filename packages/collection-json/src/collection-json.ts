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

// --- Builders ---

export function buildItem(href: string, data: Datum[], links?: Link[]): Item {
  const item: Item = { href, data };
  if (links && links.length > 0) {
    item.links = links;
  }
  return item;
}

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
