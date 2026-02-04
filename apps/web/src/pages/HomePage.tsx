export function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Genshin Team Builder</h1>
        <p className="mt-4 text-lg text-gray-600">
          AI-powered team building companion for Genshin Impact
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="text-3xl">📋</div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Collection Manager</h3>
          <p className="mt-2 text-gray-600">Track your characters, weapons, and artifacts</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="text-3xl">🤖</div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">AI Assistant</h3>
          <p className="mt-2 text-gray-600">Get personalized team recommendations</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="text-3xl">⚡</div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Team Builder</h3>
          <p className="mt-2 text-gray-600">Create and optimize your team compositions</p>
        </div>
      </div>

      <div className="mt-12 rounded-lg bg-blue-50 p-8 text-center">
        <span className="inline-block rounded-full bg-yellow-100 px-4 py-1 text-sm font-medium text-yellow-800">
          🚧 Under Development
        </span>
        <p className="mt-4 text-gray-600">
          We're working hard to bring you the best team building experience. Check back soon!
        </p>
      </div>
    </div>
  );
}
