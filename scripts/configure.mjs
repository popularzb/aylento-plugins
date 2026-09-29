// integrations/configure.mjs
import { fileURLToPath as fileURLToPath2 } from "node:url";

// integrations/host-config.mjs
import { stat } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

// client/service-origin.mjs
var DEFAULT_SERVICE_ORIGIN = "https://aylento.com";
function serviceOrigin(value = DEFAULT_SERVICE_ORIGIN) {
  const invalid = () => {
    throw new Error("\u827E\u4F26\u5154\u670D\u52A1\u5730\u5740\u5FC5\u987B\u662F HTTPS \u6E90\u5730\u5740\uFF0C\u6216 http://127.0.0.1:\u7AEF\u53E3\u3001http://localhost:\u7AEF\u53E3\uFF1B\u4E0D\u80FD\u5305\u542B\u8D26\u53F7\u3001\u8DEF\u5F84\u3001\u67E5\u8BE2\u6216\u7247\u6BB5");
  };
  if (typeof value !== "string") return invalid();
  const match = /^(https?):\/\/(\[[0-9a-fA-F:.]+\]|[a-zA-Z0-9.-]+)(?::([1-9][0-9]{0,4}))?\/?$/.exec(value);
  if (!match) return invalid();
  const [, scheme, suppliedHost, port] = match;
  if (port && Number(port) > 65535) return invalid();
  const host = suppliedHost.toLowerCase();
  if (!host.startsWith("[") && (host.length > 253 || !host.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))) return invalid();
  let url;
  try {
    url = new URL(value);
  } catch {
    return invalid();
  }
  if (url.hostname.toLowerCase() !== host || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return invalid();
  if (scheme === "http" && !["localhost", "127.0.0.1"].includes(host)) return invalid();
  return url.origin;
}

// integrations/host-config.mjs
var supportedClients = ["codex", "claude-code", "claude-desktop", "cursor", "vscode", "workbuddy", "gemini", "cherry", "generic"];
var clients = new Set(supportedClients);
var defaultServer = fileURLToPath(new URL("../plugins/aylento/scripts/server.mjs", import.meta.url));
var defaultBaseUrl = DEFAULT_SERVICE_ORIGIN;
var optionKeys = /* @__PURE__ */ new Map([
  ["--node", "node"],
  ["--server", "server"],
  ["--profile", "profile"],
  ["--base-url", "baseUrl"],
  ["--state-dir", "stateDir"]
]);
function absolutePath(value, label) {
  if (typeof value !== "string" || !isAbsolute(value) || value.includes("\0")) {
    throw new Error(`${label} \u5FC5\u987B\u662F\u672C\u673A\u7684\u7EDD\u5BF9\u8DEF\u5F84`);
  }
  return value;
}
function buildClientConfig({
  client,
  node = process.execPath,
  server = defaultServer,
  profile = client,
  baseUrl = defaultBaseUrl,
  stateDir
} = {}) {
  if (!clients.has(client)) throw new Error("\u5BA2\u6237\u7AEF\u5FC5\u987B\u662F\uFF1A" + supportedClients.join(", "));
  if (typeof profile !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(profile)) {
    throw new Error("--profile \u53EA\u80FD\u5305\u542B 1\u201340 \u4F4D\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\u6216\u77ED\u6A2A\u7EBF");
  }
  const env = { AYLENTO_BASE_URL: serviceOrigin(baseUrl), AYLENTO_PROFILE: profile };
  if (stateDir !== void 0) env.AYLENTO_STATE_DIR = absolutePath(stateDir, "--state-dir");
  const entry = {
    command: absolutePath(node, "--node"),
    args: [absolutePath(server, "--server")],
    env
  };
  if (client === "gemini") entry.trust = false;
  if (client === "codex") return { mcp_servers: { aylento: entry } };
  if (client === "vscode") return { servers: { aylento: { type: "stdio", ...entry } } };
  return { mcpServers: { aylento: entry } };
}
function formatClientConfig(config) {
  if (!config.mcp_servers) return JSON.stringify(config, null, 2) + "\n";
  const entry = config.mcp_servers.aylento;
  const quote = (value) => JSON.stringify(value).replace(/\u007f/g, "\\u007f");
  return "[mcp_servers.aylento]\ncommand = " + quote(entry.command) + "\nargs = " + quote(entry.args) + "\n\n[mcp_servers.aylento.env]\n" + Object.entries(entry.env).map(([k, v]) => k + " = " + quote(v)).join("\n") + "\n";
}
function parseSetupArgs(argv) {
  if (!Array.isArray(argv) || argv.length === 0) throw new Error("\u8BF7\u6307\u5B9A\u5BA2\u6237\u7AEF\uFF1A" + supportedClients.join(", "));
  const [client, ...rest] = argv;
  if (!clients.has(client)) throw new Error("\u5BA2\u6237\u7AEF\u5FC5\u987B\u662F\uFF1A" + supportedClients.join(", "));
  const options = { client };
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i];
    if (!optionKeys.has(flag)) throw new Error("\u5B58\u5728\u4E0D\u652F\u6301\u7684\u53C2\u6570\uFF1B\u4F7F\u7528 --help \u67E5\u770B\u7528\u6CD5");
    if (seen.has(flag)) throw new Error(`\u53C2\u6570 ${flag} \u4E0D\u80FD\u91CD\u590D`);
    if (typeof rest[i + 1] !== "string" || rest[i + 1].length === 0 || rest[i + 1].startsWith("--")) {
      throw new Error(`\u53C2\u6570 ${flag} \u7F3A\u5C11\u503C`);
    }
    seen.add(flag);
    options[optionKeys.get(flag)] = rest[i + 1];
  }
  return options;
}
async function validateExecutableFiles(config) {
  const { command, args } = (config.mcpServers || config.servers || config.mcp_servers).aylento;
  for (const [value, label] of [[command, "--node"], [args[0], "--server"]]) {
    let info;
    try {
      info = await stat(value);
    } catch {
      throw new Error(`${label} \u6307\u5B9A\u7684\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u65E0\u6CD5\u8BBF\u95EE`);
    }
    if (!info.isFile()) throw new Error(`${label} \u5FC5\u987B\u6307\u5411\u6587\u4EF6`);
  }
}

// integrations/configure.mjs
async function configureMain(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === "--help") {
    process.stdout.write(`AYLENTO host configuration / \u5BBF\u4E3B\u914D\u7F6E

node scripts/configure.mjs <host> [--profile NAME] [--node ABSOLUTE_PATH] [--server ABSOLUTE_PATH] [--base-url HTTPS_ORIGIN] [--state-dir ABSOLUTE_PATH]

Hosts: ${supportedClients.join(", ")}
Prints configuration only; merge it into your existing settings. Does not start a server, read credentials or replace any settings.
\u4EC5\u8F93\u51FA\u914D\u7F6E\uFF1B\u8BF7\u5408\u5E76\u5230\u539F\u914D\u7F6E\u3002\u4E0D\u4F1A\u542F\u52A8\u670D\u52A1\u3001\u8BFB\u53D6\u51ED\u636E\u6216\u8986\u76D6\u5BBF\u4E3B\u8BBE\u7F6E\u3002
`);
    return;
  }
  const options = parseSetupArgs(argv);
  options.server ??= fileURLToPath2(new URL("./server.mjs", import.meta.url));
  const config = buildClientConfig(options);
  await validateExecutableFiles(config);
  process.stdout.write(formatClientConfig(config));
}
if (import.meta.main) configureMain().catch((error) => {
  process.stderr.write("AYLENTO configuration: " + error.message + "\n");
  process.exitCode = 1;
});
export {
  configureMain
};
