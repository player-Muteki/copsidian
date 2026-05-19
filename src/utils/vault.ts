import type { App } from 'obsidian';

export function getVaultPath(app: App | null | undefined): string {
  const adapter = app?.vault?.adapter as {
    basePath?: string;
    getBasePath?: () => string;
  } | undefined;

  if (adapter) {
    if (typeof adapter.getBasePath === 'function') {
      try {
        const basePath = adapter.getBasePath();
        if (basePath) return basePath;
      } catch {
        // Fall through to other path hints.
      }
    }

    if (typeof adapter.basePath === 'string' && adapter.basePath.trim()) {
      return adapter.basePath.trim();
    }
  }

  return process.cwd();
}
