# AYLENTO client 0.13.0-beta.4

本次更新改进客户端分发，核心 MCP 运行版本仍为 0.13.0-beta.1，36 项工具及服务端功能保持原有版本。

- Add a WorkBuddy MCP + Skill connector with bilingual metadata/examples, an icon, privacy documentation and a managed Node runtime declaration.
- Pin its launcher to the self-contained client archive in this GitHub Release, without requiring npm registry publication.
- Build a dedicated WorkBuddy ZIP automatically on version tags and check the launcher in isolated state and npm cache. Real WorkBuddy app/model acceptance and marketplace review remain pending.
- Retain Codex, Claude Code and Gemini CLI packages and direct installation routes. Claude official directory approval remains pending.
- Keep AYLENTO Client Use License v1.0 and bundled third-party notices.
- Preserve authorization, profile and local history during upgrades.

Download the complete `aylento-plugins-0.13.0-beta.4.zip` for native plugin catalogs, the `.tgz` for a standalone local MCP client, or `aylento-workbuddy-0.13.0-beta.4.zip` for WorkBuddy connector submission. Node.js 24.15.0 or newer is required; the WorkBuddy connector declares this managed runtime and requires WorkBuddy 5.0+. See README.md and HOSTS.md for host compatibility and verification limits.

GitHub download availability does not imply npm publication or directory approval. npm and MCP Registry publishing activate only after publisher setup. Consult the workflow run and each destination for its actual status.
