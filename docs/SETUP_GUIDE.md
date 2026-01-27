# Setup Guide

Complete setup guide for the genshin.dungeon.studio project, following a test-driven development approach.

---

## Prerequisites

Ensure you have these installed:

```bash
node --version    # v20+ required
pnpm --version    # v9+ required
bun --version     # v1.0+ required
gcloud --version  # Latest
gh --version      # GitHub CLI
```

Install missing tools:
```bash
# pnpm
npm install -g pnpm

# Bun
curl -fsSL https://bun.sh/install | bash

# GitHub CLI (Linux)
sudo apt install gh
```

---

## Phase 1: Monorepo Setup ✅ (COMPLETED)

Initial structure has been set up via PR #3:
- Turborepo build orchestration
- pnpm workspace configuration
- Directory structure (apps, packages, infrastructure)
- Root package.json with scripts

---

## Phase 2: Frontend Setup (apps/web)

Initialize React app with Vite:

```bash
cd apps/web

# Create Vite project
pnpm create vite . --template react-ts

# Install core dependencies
pnpm install

# Add routing and state management
pnpm add react-router-dom zustand @tanstack/react-query

# Add Firebase
pnpm add firebase

# Add UI dependencies
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p

# Add shadcn/ui
pnpm dlx shadcn@latest init
```

### Configure Vite

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
```

### Update package.json

```json
{
  "name": "@genshin/web",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### Create Basic App

Simple hello world in `src/App.tsx`:

```typescript
function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Genshin Team Builder</h1>
        <p className="text-slate-400">Hello World - Frontend Running! 🎮</p>
      </div>
    </div>
  );
}

export default App;
```

### Test it runs

```bash
pnpm dev
# Should open http://localhost:5173
```

---

## Phase 3: Backend Setup (apps/api)

Initialize Hono server:

```bash
cd apps/api

# Create package.json
cat > package.json << 'EOF'
{
  "name": "@genshin/api",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "lint": "eslint src",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
EOF

# Install dependencies
pnpm add hono @hono/node-server
pnpm add @anthropic-ai/sdk firebase-admin zod
pnpm add -D @types/node typescript tsx
```

### Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Create Basic Server

Create `src/main.ts`:

```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS for local development
app.use('*', cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({ 
    message: 'Genshin API',
    version: '0.1.0',
    status: 'running'
  });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const port = Number(process.env.PORT) || 8080;
console.log(`🚀 Server running on http://localhost:${port}`);

serve({ 
  fetch: app.fetch, 
  port 
});

export default app;
```

### Test it runs

```bash
pnpm dev
# Should run on http://localhost:8080
# Visit http://localhost:8080 - should see JSON response
```

---

## Phase 4: Testing Framework Setup 🧪

### Install Testing Dependencies

```bash
# Root - install shared test tooling
cd /home/alunduil/genshin.dungeon.studio
pnpm add -D -w vitest @vitest/ui

# Frontend testing
cd apps/web
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Backend testing
cd ../api
pnpm add -D vitest @vitest/ui
```

### Configure Frontend Tests

Create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

Create `apps/web/src/test/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

Create `apps/web/src/App.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders app title', () => {
    render(<App />);
    expect(screen.getByText(/genshin team builder/i)).toBeInTheDocument();
  });

  it('displays hello world message', () => {
    render(<App />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
```

### Configure Backend Tests

Create `apps/api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

Create `apps/api/src/main.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import app from './main';

describe('API', () => {
  it('returns genshin api message on root', async () => {
    const res = await app.request('/', { method: 'GET' });
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.message).toBe('Genshin API');
  });

  it('health check returns healthy status', async () => {
    const res = await app.request('/api/health', { method: 'GET' });
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });
});
```

### Run Tests

```bash
# From root - runs all tests
pnpm test

# Run tests in specific app
cd apps/web && pnpm test
cd apps/api && pnpm test

# Run with UI
pnpm test:ui
```

### ✅ Verification Checklist

Before proceeding to deployment and features:

- [ ] Frontend runs on http://localhost:5173
- [ ] Backend runs on http://localhost:8080
- [ ] Frontend tests pass (`cd apps/web && pnpm test`)
- [ ] Backend tests pass (`cd apps/api && pnpm test`)
- [ ] Both apps run together via `pnpm dev` from root
- [ ] Understand monorepo structure
- [ ] Understand how tests are organized
- [ ] Ready for test-driven feature development

---

## Next Steps

Once hello world with tests is complete:

1. **Set up GCP Project** - Create GCP resources (Firestore, Cloud Run, Storage)
2. **Configure Firebase** - Set up authentication
3. **Add Environment Variables** - Configure secrets
4. **First Deployment** - Deploy hello world to production
5. **Feature Development** - Build actual features with TDD

See [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for ongoing development practices.
