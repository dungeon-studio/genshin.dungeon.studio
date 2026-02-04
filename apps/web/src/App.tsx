import './App.css';

export function App() {
  return (
    <div className="app">
      <div className="hero">
        <h1>Genshin Team Builder</h1>
        <p className="subtitle">AI-powered team building companion</p>
        <div className="status">
          <span className="badge">🚧 Under Development</span>
        </div>
        {/* Tailwind test - element color badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-pyro px-3 py-1 text-sm font-medium text-white shadow-md">
            Pyro
          </span>
          <span className="rounded-full bg-hydro px-3 py-1 text-sm font-medium text-white shadow-md">
            Hydro
          </span>
          <span className="rounded-full bg-electro px-3 py-1 text-sm font-medium text-white shadow-md">
            Electro
          </span>
          <span className="rounded-full bg-cryo px-3 py-1 text-sm font-medium text-white shadow-md">
            Cryo
          </span>
          <span className="rounded-full bg-anemo px-3 py-1 text-sm font-medium text-white shadow-md">
            Anemo
          </span>
          <span className="rounded-full bg-geo px-3 py-1 text-sm font-medium text-white shadow-md">
            Geo
          </span>
          <span className="rounded-full bg-dendro px-3 py-1 text-sm font-medium text-white shadow-md">
            Dendro
          </span>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <span className="icon">📋</span>
          <h3>Collection Manager</h3>
          <p>Track your characters, weapons, and artifacts</p>
        </div>

        <div className="feature-card">
          <span className="icon">🤖</span>
          <h3>AI Assistant</h3>
          <p>Get personalized team recommendations</p>
        </div>

        <div className="feature-card">
          <span className="icon">⚡</span>
          <h3>Team Builder</h3>
          <p>Create and optimize your team compositions</p>
        </div>
      </div>

      <footer className="footer">
        <p>Built with React 19 + TypeScript + Vite</p>
      </footer>
    </div>
  );
}
