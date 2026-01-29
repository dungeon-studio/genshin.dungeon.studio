# How to Add UI Components

This guide shows you how to add shadcn/ui components to the frontend application.

## Prerequisites

- You're in the `apps/web` directory
- Frontend dependencies are installed (`pnpm install`)

## Steps

1. **Navigate to the web app:**

```bash
cd apps/web
```

2. **Add the component:**

```bash
# Add a single component
pnpm dlx shadcn@latest add button

# Add multiple components
pnpm dlx shadcn@latest add button card dialog
```

3. **Use the component:**

```typescript
// In your React component
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return <Button variant="default">Click me</Button>;
}
```

## Component Location

Components are added to `apps/web/src/components/ui/` and can be imported using the `@/` path alias.

## Available Components

See the [shadcn/ui documentation](https://ui.shadcn.com/) for the full list of available components.
