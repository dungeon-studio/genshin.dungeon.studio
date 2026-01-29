# How to Add API Endpoints

This guide shows you how to create new API endpoints using Hono.

## Prerequisites

- Backend dependencies are installed
- You understand the basic structure of Hono routes

## Steps

### 1. Create a Route File

Create a new file in `apps/api/src/routes/`:

```typescript
// apps/api/src/routes/collection.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/characters', async (c) => {
  // Implementation
  return c.json({ characters: [] });
});

app.post('/characters', async (c) => {
  const body = await c.req.json();
  // Implementation
  return c.json({ success: true });
});

export default app;
```

### 2. Register the Route

Add the route to the main application:

```typescript
// apps/api/src/main.ts
import collection from './routes/collection';

// Register with a base path
app.route('/api/collection', collection);
```

### 3. Test the Endpoint

Start the dev server and test:

```bash
# From root
pnpm dev

# Test with curl
curl http://localhost:8080/api/collection/characters
```

## Best Practices

- Group related endpoints in the same route file
- Use TypeScript types for request/response bodies
- Add middleware for authentication where needed
- Return consistent JSON response formats
