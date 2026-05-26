import { describe, expect, it, beforeEach } from 'vitest';
import { getVaultPath } from './vault';

describe('getVaultPath', () => {
  let originalCwd: () => string;

  beforeEach(() => {
    originalCwd = process.cwd;
  });

  it('returns basePath from adapter.getBasePath() when available', () => {
    const app = {
      vault: {
        adapter: {
          getBasePath: () => '/Users/test/vault',
          basePath: '/other/path',
        },
      },
    } as any;

    expect(getVaultPath(app)).toBe('/Users/test/vault');
  });

  it('falls back to adapter.basePath when getBasePath returns empty', () => {
    const app = {
      vault: {
        adapter: {
          getBasePath: () => '',
          basePath: '/Users/test/vault',
        },
      },
    } as any;

    expect(getVaultPath(app)).toBe('/Users/test/vault');
  });

  it('falls back to adapter.basePath when getBasePath throws', () => {
    const app = {
      vault: {
        adapter: {
          getBasePath: () => { throw new Error('not supported'); },
          basePath: '/Users/test/vault',
        },
      },
    } as any;

    expect(getVaultPath(app)).toBe('/Users/test/vault');
  });

  it('falls back to process.cwd() when adapter has no paths', () => {
    process.cwd = () => '/current/dir';
    const app = {
      vault: {
        adapter: {},
      },
    } as any;

    expect(getVaultPath(app)).toBe('/current/dir');
    process.cwd = originalCwd;
  });

  it('falls back to process.cwd() when adapter is undefined', () => {
    process.cwd = () => '/current/dir';
    const app = {
      vault: {
        adapter: undefined,
      },
    } as any;

    expect(getVaultPath(app)).toBe('/current/dir');
    process.cwd = originalCwd;
  });

  it('falls back to process.cwd() when vault is undefined', () => {
    process.cwd = () => '/current/dir';
    const app = {
      vault: undefined,
    } as any;

    expect(getVaultPath(app)).toBe('/current/dir');
    process.cwd = originalCwd;
  });

  it('falls back to process.cwd() when app is null', () => {
    process.cwd = () => '/current/dir';
    expect(getVaultPath(null)).toBe('/current/dir');
    process.cwd = originalCwd;
  });

  it('falls back to process.cwd() when app is undefined', () => {
    process.cwd = () => '/current/dir';
    expect(getVaultPath(undefined)).toBe('/current/dir');
    process.cwd = originalCwd;
  });

  it('trims whitespace from basePath', () => {
    const app = {
      vault: {
        adapter: {
          basePath: '  /Users/test/vault  ',
        },
      },
    } as any;

    expect(getVaultPath(app)).toBe('/Users/test/vault');
  });

  it('ignores empty whitespace-only basePath', () => {
    process.cwd = () => '/current/dir';
    const app = {
      vault: {
        adapter: {
          basePath: '   ',
        },
      },
    } as any;

    expect(getVaultPath(app)).toBe('/current/dir');
    process.cwd = originalCwd;
  });

  it('prefers getBasePath() over basePath when both return values', () => {
    const app = {
      vault: {
        adapter: {
          getBasePath: () => '/from/method',
          basePath: '/from/property',
        },
      },
    } as any;

    expect(getVaultPath(app)).toBe('/from/method');
  });

  it('falls back to basePath when getBasePath returns null', () => {
    const app = {
      vault: {
        adapter: {
          getBasePath: () => null,
          basePath: '/from/property',
        },
      },
    } as any;

    expect(getVaultPath(app)).toBe('/from/property');
  });
});
