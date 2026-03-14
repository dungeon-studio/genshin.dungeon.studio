// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { createVersionedFileRoutes } from '@/routes/versioned-files.js';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it } from 'vitest';

const CONTENT_TYPE = 'application/test+json';

describe('createVersionedFileRoutes', () => {
  describe('flat structure (module/version.json)', () => {
    const directory = 'test/fixtures/flat';
    const app = new Hono();
    app.route(`/${directory}`, createVersionedFileRoutes({ contentType: CONTENT_TYPE, directory }));

    describe('GET known file', () => {
      let res: Response;

      beforeEach(async () => {
        res = await app.request(`/${directory}/things/1.0.0.json`);
      });

      it('returns 200', () => {
        expect(res.status).toBe(200);
      });

      it('returns configured content type', () => {
        expect(res.headers.get('content-type')).toBe(CONTENT_TYPE);
      });

      it('returns file contents', async () => {
        const body = await res.json();
        expect(body).toEqual({ flat: true });
      });
    });

    describe('GET unknown file', () => {
      it('returns 404 for unknown module', async () => {
        const res = await app.request(`/${directory}/unknown/1.0.0.json`);

        expect(res.status).toBe(404);
      });

      it('returns 404 for unknown version', async () => {
        const res = await app.request(`/${directory}/things/99.0.0.json`);

        expect(res.status).toBe(404);
      });
    });

    describe('GET latest redirect', () => {
      let res: Response;

      beforeEach(async () => {
        res = await app.request(`/${directory}/things.json`, { redirect: 'manual' });
      });

      it('returns 302', () => {
        expect(res.status).toBe(302);
      });

      it('redirects to highest version', () => {
        expect(res.headers.get('location')).toBe(`/${directory}/things/2.0.0.json`);
      });
    });

    describe('GET latest redirect (not found)', () => {
      it('returns 404 for unknown module', async () => {
        const res = await app.request(`/${directory}/unknown.json`);

        expect(res.status).toBe(404);
      });

      it('returns 404 when path does not end in .json', async () => {
        const res = await app.request(`/${directory}/things`);

        expect(res.status).toBe(404);
      });
    });
  });

  describe('nested structure (module/name/version.json)', () => {
    const directory = 'test/fixtures/nested';
    const app = new Hono();
    app.route(`/${directory}`, createVersionedFileRoutes({ contentType: CONTENT_TYPE, directory }));

    describe('GET known file', () => {
      let res: Response;

      beforeEach(async () => {
        res = await app.request(`/${directory}/things/action/1.0.0.json`);
      });

      it('returns 200', () => {
        expect(res.status).toBe(200);
      });

      it('returns configured content type', () => {
        expect(res.headers.get('content-type')).toBe(CONTENT_TYPE);
      });

      it('returns file contents', async () => {
        const body = await res.json();
        expect(body).toEqual({ nested: true });
      });
    });

    describe('GET unknown file', () => {
      it('returns 404 for unknown name', async () => {
        const res = await app.request(`/${directory}/things/missing/1.0.0.json`);

        expect(res.status).toBe(404);
      });
    });

    describe('GET latest redirect', () => {
      let res: Response;

      beforeEach(async () => {
        res = await app.request(`/${directory}/things/action.json`, { redirect: 'manual' });
      });

      it('returns 302', () => {
        expect(res.status).toBe(302);
      });

      it('redirects to highest version', () => {
        expect(res.headers.get('location')).toBe(`/${directory}/things/action/2.0.0.json`);
      });
    });

    describe('GET latest redirect (not found)', () => {
      it('returns 404 for unknown name', async () => {
        const res = await app.request(`/${directory}/things/missing.json`);

        expect(res.status).toBe(404);
      });
    });
  });

  describe('empty directory', () => {
    const directory = 'test/fixtures/nonexistent';
    const app = new Hono();
    app.route(`/${directory}`, createVersionedFileRoutes({ contentType: CONTENT_TYPE, directory }));

    it('returns 404 for any path', async () => {
      const res = await app.request(`/${directory}/anything/1.0.0.json`);

      expect(res.status).toBe(404);
    });
  });
});
