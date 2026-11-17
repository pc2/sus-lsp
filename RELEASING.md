# Releasing

1. Set `version` in `package.json` (drop any `-dev` suffix).
2. Commit, tag and push:
   ```sh
   git commit -am "Release X.Y.Z :tada:"
   git tag vX.Y.Z
   git push origin master vX.Y.Z
   ```
3. `.github/workflows/release.yml` takes over: it checks that the tag matches `package.json`, lints, packages the `.vsix`, publishes it to the VS Code Marketplace, and creates a GitHub release with the `.vsix` attached.

To check locally beforehand: `npm ci && npm run lint && vsce package`

## One-time setup

The workflow uses VS Code Marketplace Trusted Publishing, so no access token is stored. On https://marketplace.visualstudio.com/manage → publisher `LennartVanHirtum` → Trusted Publishing → Create:

- Repository owner: `pc2`
- Repository: `sus-lsp`
- Workflow: `release.yml`
- Environment: `release`
