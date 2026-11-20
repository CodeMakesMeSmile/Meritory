/** Shown while a signed-in page waits on the API */
export default function Loading() {
  return (
    <main className="graph-paper flex min-h-screen items-center justify-center p-4">
      <p role="status" className="text-body text-secondary">
        Loading your cards
      </p>
    </main>
  );
}
