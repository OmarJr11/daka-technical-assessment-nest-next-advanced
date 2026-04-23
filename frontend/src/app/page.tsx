import type { ReactElement } from "react";

/**
 * Renders a minimal root page while middleware redirects by auth state.
 * @returns {ReactElement} Root page
 */
export default function HomePage(): ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <p className="text-sm text-zinc-600">Redirecting...</p>
    </main>
  );
}
