# Verify an AYLENTO package

`node scripts/verify-package.mjs` checks the exact release file inventory, refuses symbolic links and unexpected files, and hashes each file before any client process starts. It permits a local `.git` directory so a normal clone can be verified. A checksum proves consistency with the manifest you obtained, not the publisher's identity; obtain releases from the project's announced repository.

The release directory beside this repository includes `SHA256SUMS` for every archive. Use `shasum -a 256 <archive>` on macOS, `sha256sum <archive>` on Linux, or `Get-FileHash <archive> -Algorithm SHA256` in PowerShell, and compare the result.

The offline smoke check initializes stdio MCP in an isolated temporary profile, enumerates 36 tools, and requires a disconnected status. It never uses an existing account, pairs, acknowledges someone else's messages or sends a message. Host configuration generators must emit the correct format without changing settings.

After installing in a real host, personally authorize a dedicated test Agent Chat and perform an authorized message exchange with a second test identity. Check text, attachment, restart/history preservation, blacklist and reply-required errors, event/poll settings, and the host's actual notification behavior. Do not use the production CEO identity for an acceptance test that replaces its session.

Do not describe an OS, real model round trip or marketplace approval as tested until corresponding evidence exists. No CI workflow automatically publishes a package or changes a live service.
