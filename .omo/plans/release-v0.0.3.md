# Release v0.0.3

## Objective
Commit the robustness fixes and publish v0.0.3 release.

## Tasks

1. Update `package.json` version to `0.0.3`
2. Update `manifest.json` version to `0.0.3`
3. Update `release/manifest.json` version to `0.0.3`
4. Update `CHANGELOG.md` with 0.0.3 entry
5. Rebuild to produce `main.js` + `styles.css`
6. Copy built artifacts to `release/`
7. Stage all files + commit: `chore: v0.0.3 release`
8. Tag: `git tag v0.0.3`
9. Push commit + tag to remote

## Verification
- `tsc --noEmit` passes
- `npm run build` produces 64.2kb main.js
- All 6 source files staged
