// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import {
  deleteCharacter,
  getCharacter,
  listCharacters,
  saveCharacter,
} from '@/repositories/characters/index.js';
import { getCharacterById } from '@genshin/game-data';
import {
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
  isValidConstellationLevel,
} from '@genshin/types';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const characters = new Hono<{ Variables: AuthVariables }>();

characters.use('*', auth);

interface SaveCharacterBody {
  constellationLevel?: unknown;
}

// GET /api/characters — List user's character collection
characters.get('/', async (c) => {
  const userId = c.get('user').uid;
  const items = await listCharacters(userId);

  return c.json(items);
});

// GET /api/characters/:characterId — Get specific character record
characters.get('/:characterId', async (c) => {
  const userId = c.get('user').uid;
  const { characterId } = c.req.param();

  const character = await getCharacter(userId, characterId);

  if (!character) {
    throw new HTTPException(404, { message: 'Character not found in collection' });
  }

  return c.json(character);
});

// PUT /api/characters/:characterId — Save/update character (idempotent upsert)
characters.put('/:characterId', async (c) => {
  const userId = c.get('user').uid;
  const { characterId } = c.req.param();

  // Verify characterId exists in game data
  if (!getCharacterById(characterId)) {
    throw new HTTPException(400, { message: `Unknown character: ${characterId}` });
  }

  let body: SaveCharacterBody;
  try {
    body = await c.req.json<SaveCharacterBody>();
  } catch {
    throw new HTTPException(400, { message: 'Invalid or missing JSON body' });
  }

  const { constellationLevel } = body;

  if (!isValidConstellationLevel(constellationLevel)) {
    throw new HTTPException(400, {
      message: `constellationLevel must be an integer between ${MIN_CONSTELLATION_LEVEL} and ${MAX_CONSTELLATION_LEVEL}`,
    });
  }

  const { character, created } = await saveCharacter(userId, characterId, constellationLevel);

  return c.json(character, created ? 201 : 200);
});

// DELETE /api/characters/:characterId — Remove from collection
characters.delete('/:characterId', async (c) => {
  const userId = c.get('user').uid;
  const { characterId } = c.req.param();

  await deleteCharacter(userId, characterId);

  return c.body(null, 204);
});
