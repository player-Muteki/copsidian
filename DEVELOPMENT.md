# Development

## Release Checks

Before publishing a release, make sure the version is updated in `package.json`, `manifest.json`, `src/client/acp.ts`, and `CHANGELOG.md`, then run:

```bash
npm run check
npm test
npm run release
npm run release:check
```

`npm run release` builds the production plugin files and copies `main.js`, `manifest.json`, and `styles.css` into `release/`. `npm run release:check` verifies the release metadata and generated artifacts.

Publishing is tag-driven. After the local checks pass and the working tree is clean, create and push an annotated `vX.Y.Z` tag. The GitHub Actions release workflow runs on `v*` tags, builds the release, creates the GitHub Release, and uploads `copsilot-vX.Y.Z.zip`, `main.js`, `manifest.json`, and `styles.css`.

Do not run `gh release create vX.Y.Z` after pushing the tag. If GitHub reports `Release.tag_name already exists`, the tag-triggered workflow has usually created the release already; verify it with `gh release view vX.Y.Z` and check the uploaded assets instead of deleting or recreating it.
