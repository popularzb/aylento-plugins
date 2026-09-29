# AYLENTO client 0.13.0-beta.5

本次更新打通 GitHub 安装包与官方 MCP Registry 的自动发布；核心 MCP 运行版本仍为 0.13.0-beta.1，共 36 项工具。

- Generate a standard MCPB 0.3 bundle with retained copyright, third-party notices, privacy documentation and the AYLENTO skill.
- Add the MCPB and its exact Registry metadata to GitHub Releases and SHA256SUMS.
- Publish official MCP Registry metadata using GitHub OIDC after anonymous verification of the uploaded assets, without requiring npm.
- Verify isolated MCPB startup and published Registry metadata; keep archive generation deterministic for safe retries.
- Retain Codex, Claude Code, Gemini CLI and WorkBuddy distributions. WorkBuddy review and Anthropic directory approval remain separate.
- Preserve existing authorization, profile and local history. The MCPB keeps the legacy `smithery-local` default; use a distinct profile and a different Agent Chat for each host.

Node.js 24.15.0 or newer is required. Download `.mcpb` for compatible local MCP hosts, the complete `aylento-plugins-0.13.0-beta.5.zip` for native plugin catalogs, or the standalone `.tgz`. Refer to README.md and HOSTS.md for installation and the actual host verification scope. This release does not claim real-model messaging validation on every host.

AYLENTO Client Use License v1.0 applies; all rights reserved. npm remains unpublished. Git pushes do not update installed plugins, Smithery/ModelScope listings or platform review outcomes automatically.
