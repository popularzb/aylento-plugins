# Host compatibility / 宿主兼容

One MCP client, host-specific packaging. Package validation, MCP protocol checks and a host model's real message round trip are different checks. The table describes delivered integration routes, not certification or directory approval.

| Host | Delivered route | Configuration / installation location | Acceptance boundary |
| --- | --- | --- | --- |
| Codex local | Plugin + skill + catalog; optional TOML generator | `.agents/plugins/marketplace.json`; manual output merges into Codex config | Native catalog/install tested in isolated Codex home; current real account left intact |
| Claude Code | Dedicated plugin + skill + marketplace | `.claude-plugin/marketplace.json` → `claude/aylento` | Manifest validated using installed CLI; real model messaging still to be tested |
| Gemini CLI | Root extension manifest, context and bundled runtime | `gemini extensions install https://github.com/popularzb/aylento-plugins --ref=main` | Gemini CLI 0.61.0 installed from public Git; host MCP connection and isolated 36-tool check passed on macOS; real model messaging still to be tested |
| Cursor | Configuration generator | `.cursor/mcp.json` or user MCP settings | JSON and stdio checked; real host acceptance pending |
| VS Code Copilot | `servers` configuration generator | `.vscode/mcp.json` or MCP: Open User Configuration | JSON and stdio checked; Agent mode/model acceptance pending |
| Claude Desktop | Local MCP configuration generator | Desktop developer settings / `claude_desktop_config.json` | External Node 24.15+ required; not a signed MCPB desktop extension |
| WorkBuddy | Local stdio configuration generator + skill | Custom connector MCP settings | Manual route; not a submitted or approved marketplace connector |
| Cherry Studio | Local MCP configuration generator | MCP settings | Manual route; host/model acceptance pending |
| Other local MCP clients | Generic configuration generator | Host-specific | Host must support stdio, process launch and tool approval |

Each generated config has a separate default profile. Preserve an existing custom profile on upgrades with `--profile NAME`. Do not copy one identity's credentials to another host. `--state-dir` is an optional absolute directory chosen by its owner, not a location inside this repository.

**Operating systems:** local protocol and clean-install checks run on the validation machine listed in the release evidence. Windows/Linux real-device acceptance is not implied. Node's executable must be accessible to the GUI host; use `--node` with its absolute path if PATH differs. All paths remain separate argument-array entries, including spaces and Chinese characters.

## Platform documentation

- [OpenAI plugin packaging and catalogs](https://developers.openai.com/plugins/build/plugins)
- [Claude plugin manifest](https://code.claude.com/docs/en/plugins-reference) and [marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Gemini CLI extension releases](https://geminicli.com/docs/extensions/releasing/)
- [Cursor MCP](https://prod.cursor.com/docs/mcp)
- [VS Code MCP configuration](https://code.visualstudio.com/docs/agent-customization/mcp-servers)
- [WorkBuddy connectors](https://open.workbuddy.cn/en/docs/connector)
- [Claude Desktop local MCP](https://modelcontextprotocol.io/docs/develop/connect-local-servers)

Reviewed 2026-09-29. Platform capabilities can change; release evidence describes this package's actual checks.

## Further channels

GitHub repository/Releases and our own catalogs are the initial sharing routes. npm and the MCP Registry need separate package publication and ownership verification. WorkBuddy's marketplace needs its own connector metadata, runtime and authorization acceptance. Claude Desktop's one-click extension route needs a validated MCPB runtime. None are automatically published by uploading this repository.

ChatGPT/Gemini cloud connections require remote MCP plus appropriate authentication and a defined destination for durable message history. This local client must not ACK messages merely because an ephemeral cloud model saw them. Cloud support is a separate implementation, not a replacement URL in these files.
