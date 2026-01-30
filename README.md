# Genshin Team Builder

AI-powered team building companion for Genshin Impact.

> **Status**: 🚧 Under active development

Chat with an AI assistant about YOUR collection to get personalized team recommendations.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Hono (Node.js)
- **AI**: Claude (Anthropic) via Model Context Protocol
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **Hosting**: GCP (Cloud Run + Cloud Storage)

## Getting Started

### Quick Start (Recommended) 🚀

**Using VS Code with DevContainers** (easiest):

1. Clone and open in VS Code
2. Click "Reopen in Container" when prompted
3. Done! Everything is pre-configured

The frontend will be available at http://localhost:5173
The backend will be available at http://localhost:8080 (when implemented)

### Manual Setup (Alternative)

If you prefer not to use DevContainers:

- **Prerequisites**: Node.js 20+, pnpm 9+
- **See**: [Manual Setup Guide](./docs/how-tos/manual-setup.md)

```bash
# Terminal setup (no VS Code or DevContainers required)
git clone https://github.com/dungeon-studio/genshin.dungeon.studio.git
cd genshin.dungeon.studio
pnpm install
pnpm dev
```

### Project Structure

```
genshin.dungeon.studio/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Hono backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── game-data/    # Static game data
├── docs/             # Project documentation
└── infrastructure/   # Deployment scripts
```

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution workflow and daily development practices.

## Features (Planned)

- ✅ Monorepo structure with Turborepo
- ✅ Frontend with React 19 + Vite + TypeScript
- 🚧 Character collection management
- 🚧 AI-powered team recommendations
- 🚧 Team builder interface
- 🚧 Progressive Web App support

## Contributing

This project follows test-driven development and conventional commits. See our [documentation](./docs/) for guidelines.

## License

MIT
