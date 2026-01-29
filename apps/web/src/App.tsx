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
