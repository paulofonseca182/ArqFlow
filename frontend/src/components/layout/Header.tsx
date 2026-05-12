export function Header() {
  return (
    <header className="border-b border-surface-600 bg-surface-900/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-text-muted">Escritório local</p>
          <h1 className="text-lg font-semibold text-text-primary">ArqFlow</h1>
        </div>
      </div>
    </header>
  );
}
