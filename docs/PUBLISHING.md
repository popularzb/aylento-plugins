# Publishing and updates / 发布与更新

AYLENTO retains copyright. The complete private project is maintained separately; this repository contains only the exported client distribution. Never push the private repository or its history into this public repository.

## Automatic GitHub releases

Changes pushed to `main` run inventory, isolated MCP and package checks. A version tag such as `v0.13.0-beta.3` additionally creates a GitHub download release. The tag must match package.json. Failed validation stops publication. Existing release assets are not overwritten. A prerelease version remains marked as a prerelease.

The client distribution version is 0.13.0-beta.3; its bundled MCP runtime is 0.13.0-beta.1. Client-only packaging changes do not require redeploying the account service.

## One-time npm setup

1. Sign in to the publisher's npm account, verify email and complete npm's required authentication.
2. Build the release outside the checkout with `node scripts/prepare-release.mjs /absolute/path/to/new-release v0.13.0-beta.3`.
3. Verify its staged package with `node /absolute/path/to/new-release/npm/scripts/verify-package.mjs` and `node /absolute/path/to/new-release/npm/scripts/smoke.mjs`.
4. Publish the first archive using `node scripts/publish-npm.mjs /absolute/path/to/new-release`. This needs the publisher's npm login and any npm-requested verification. A web login alone does not sign in the terminal.
5. In the package's npm settings, configure GitHub trusted publishing for owner `popularzb`, repository `aylento-plugins`, workflow `publish.yml`, allowing direct publishing if unattended publication is wanted. This grants that workflow permission to publish this package.
6. Only after that configuration is confirmed, set GitHub repository variable `NPM_TRUSTED_PUBLISHING` to `enabled`.

No npm access token is placed in the public repository. npm OIDC trusted publishing requires a sufficiently recent npm CLI and a GitHub-hosted runner. An already published version is accepted only when its registry integrity matches the locally prepared archive exactly. Versions cannot be reused for different content.

## Official MCP Registry

`server.json` points to the exact npm package version and the package's `mcpName`. Once npm publishing is configured, set repository variable `MCP_REGISTRY_PUBLISH` to `enabled`. Tagged releases then authenticate using GitHub OIDC and publish the metadata. The Registry hosts discovery metadata; the underlying package must already exist on npm.

The workflow gates these external channels until setup is complete. Disabled channels are explicitly reported; a green GitHub release alone does not mean those channels are published.

## Directory and end-user updates

Gemini's gallery indexes public repositories with the `gemini-cli-extension` topic after its own validation. Installation from Git should use the official repository and a selected ref; users review the host's install/update prompts. Manual ZIP installations need a replacement download. npm installations need an explicit upgrade command or a host-managed update policy.

Anthropic, WorkBuddy and other reviewed directories may require separate review or metadata updates. GitHub publishing does not automatically grant directory approval. Never change the license to satisfy a directory without the owner's authorization.

Preserve the user's base URL, profile, state directory and authorization. Never clear history or re-pair a valid identity merely to update code.

References: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [MCP GitHub Actions](https://modelcontextprotocol.io/registry/github-actions), [Gemini releases](https://geminicli.com/docs/extensions/releasing/).
