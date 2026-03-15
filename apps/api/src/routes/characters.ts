// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { ValidatedBodyVariables } from '@/middleware/validate-body.js';
import { validateBody } from '@/middleware/validate-body.js';
import {
  deleteCharacter,
  getCharacter,
  listCharacters,
  saveCharacter,
} from '@/repositories/characters/index.js';
import { characterPutRequestV1 } from '@/schemas/characters/put-request-v1.js';
import { COLLECTION_JSON, serialiseCollection } from '@genshin/collection-json';
import { characterItemHref, characterRepresentation, serialiseCharacter } from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const characters = new Hono<{ Variables: AuthVariables & ValidatedBodyVariables }>();

characters.use('*', auth);

const PROFILE_PATH = '/profiles/characters/1.0.0.json';

interface SaveCharacterBody {
  constellationLevel: number;
}

// GET /api/characters — List user's character collection
characters.get('/', async (c) => {
  const userId = c.get('user').uid;
  const items = await listCharacters(userId);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(
    JSON.stringify(
      serialiseCollection(
        characterRepresentation,
        `${baseUrl}/api/characters`,
        items.map((item) => serialiseCharacter(item, baseUrl)),
      ),
    ),
    {
      headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
    },
  );
});

// GET /api/characters/:characterId — Get specific character record
characters.get('/:characterId', async (c) => {
  const userId = c.get('user').uid;
  const { characterId } = c.req.param();

  const character = await getCharacter(userId, characterId);

  if (!character) {
    throw new HTTPException(404, { message: 'Character not found in collection' });
  }

  const baseUrl = new URL(c.req.url).origin;

  return c.body(
    JSON.stringify(
      serialiseCollection(characterRepresentation, characterItemHref(baseUrl, character), [
        serialiseCharacter(character, baseUrl),
      ]),
    ),
    {
      headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
    },
  );
});

// PUT /api/characters/:characterId — Save/update character (idempotent upsert)
characters.put('/:characterId', validateBody(characterPutRequestV1.schema), async (c) => {
  const userId = c.get('user').uid;
  const { characterId } = c.req.param();

  if (!getCharacterById(characterId)) {
    throw new HTTPException(400, { message: `Unknown character: ${characterId}` });
  }

  const { constellationLevel } = c.get('validatedBody') as SaveCharacterBody;
  const { character, created } = await saveCharacter(userId, characterId, constellationLevel);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(
    JSON.stringify(
      serialiseCollection(characterRepresentation, characterItemHref(baseUrl, character), [
        serialiseCharacter(character, baseUrl),
      ]),
    ),
    {
      status: created ? 201 : 200,
      headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
    },
  );
});

// DELETE /api/characters/:characterId — Remove from collection
characters.delete('/:characterId', async (c) => {
  const userId = c.get('user').uid;
  const { characterId } = c.req.param();

  await deleteCharacter(userId, characterId);

  return c.body(null, 204);
});
