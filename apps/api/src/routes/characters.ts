// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { COLLECTION_JSON, serialiseCollection } from '@genshin/collection-json';
import { characterItemHref, characterRepresentation, serialiseCharacter } from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { NegotiatedContentVariables } from '@/middleware/negotiate-content.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import type { NegotiatedRequestSchemaVariables } from '@/middleware/negotiate-request-schema.js';
import { negotiateRequestSchema } from '@/middleware/negotiate-request-schema.js';
import type { ValidatedRequestBodyVariables } from '@/middleware/validate-request-body.js';
import { validateRequestBody } from '@/middleware/validate-request-body.js';
import { characterItemV1 } from '@/profiles/alps/character/item-v1.js';
import { characterPutRequestV1 } from '@/profiles/json-schema/characters/put-request-v1.js';
import * as Characters from '@/repositories/characters/index.js';

export const characters = new Hono<{
  Variables: AuthVariables &
    NegotiatedContentVariables &
    NegotiatedRequestSchemaVariables &
    ValidatedRequestBodyVariables;
}>();

characters.use('*', auth);

characters.use('*', negotiateContent([{ mediaType: COLLECTION_JSON, profile: characterItemV1 }]));

interface SaveCharacterBody {
  constellationLevel: number;
}

// GET /api/characters — List user's character collection
characters.get('/', async (c) => {
  const userId = c.get('user').uid;
  const items = await Characters.list(userId);
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
      headers: { 'Content-Type': c.get('negotiatedMediaType') },
    },
  );
});

// GET /api/characters/:characterId — Get specific character record
characters.get('/:characterId', async (c) => {
  const userId = c.get('user').uid;
  const { characterId } = c.req.param();

  const character = await Characters.get(userId, characterId);

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
      headers: { 'Content-Type': c.get('negotiatedMediaType') },
    },
  );
});

// PUT /api/characters/:characterId — Save/update character (idempotent upsert)
characters.put(
  '/:characterId',
  negotiateRequestSchema([characterPutRequestV1]),
  validateRequestBody([characterPutRequestV1]),
  async (c) => {
    const userId = c.get('user').uid;
    const { characterId } = c.req.param();

    if (!getCharacterById(characterId)) {
      throw new HTTPException(400, { message: `Unknown character: ${characterId}` });
    }

    const { constellationLevel } = c.get('validatedBody') as SaveCharacterBody;
    const { character, created } = await Characters.save(userId, characterId, constellationLevel);
    const baseUrl = new URL(c.req.url).origin;

    return c.body(
      JSON.stringify(
        serialiseCollection(characterRepresentation, characterItemHref(baseUrl, character), [
          serialiseCharacter(character, baseUrl),
        ]),
      ),
      {
        status: created ? 201 : 200,
        headers: { 'Content-Type': c.get('negotiatedMediaType') },
      },
    );
  },
);

// DELETE /api/characters/:characterId — Remove from collection
characters.delete('/:characterId', async (c) => {
  const userId = c.get('user').uid;
  const { characterId } = c.req.param();

  await Characters.remove(userId, characterId);

  return c.body(null, 204);
});
