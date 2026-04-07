// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">Welcome to Genshin Planner</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Plan your teams and manage your collection
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
          <div className="text-3xl" aria-hidden="true">
            📋
          </div>
          <h3 className="mt-4 text-lg font-semibold text-card-foreground">Collection Manager</h3>
          <p className="mt-2 text-muted-foreground">
            Track your characters, weapons, and artifacts
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
          <div className="text-3xl" aria-hidden="true">
            🤖
          </div>
          <h3 className="mt-4 text-lg font-semibold text-card-foreground">AI Assistant</h3>
          <p className="mt-2 text-muted-foreground">Get personalized team recommendations</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
          <div className="text-3xl" aria-hidden="true">
            ⚡
          </div>
          <h3 className="mt-4 text-lg font-semibold text-card-foreground">Team Builder</h3>
          <p className="mt-2 text-muted-foreground">Create and optimize your team compositions</p>
        </div>
      </div>

      <div className="mt-12 rounded-lg bg-muted p-8 text-center">
        <span className="inline-block rounded-full bg-yellow-100 px-4 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          <span aria-hidden="true">🚧</span> Under Development
        </span>
        <p className="mt-4 text-muted-foreground">
          We're working hard to bring you the best team building experience. Check back soon!
        </p>
      </div>
    </div>
  );
}
