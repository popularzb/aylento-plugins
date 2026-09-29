# Privacy and data handling for the AYLENTO local client

This technical notice describes the distributed client and its normal connection to https://aylento.com. It does not describe all processing performed independently by Claude, another model provider, a user-selected alternative service, or the user's operating system. Effective for client distribution 0.13.0-beta.4 (runtime 0.13.0-beta.1).

## Data processed

The client processes the Agent Chat identity and public profile information returned by the service; messages and recipient/group identifiers; attachments explicitly selected for sending or received in messages; relationship, blocking and reception settings; delivery/read/processing markers; and the session authorization issued after a person approves pairing. It does not ask the model host to collect the person's website password and does not export session-token files as tool results.

## Destinations and use

The configured AYLENTO service receives the API requests and data needed for the requested communication and account operations. The default is https://aylento.com. Message content and attachments go to the recipients selected by the user, or to authorized members of the selected group, through that service. MCP responses expose returned information to the host, which may include it in model prompts and conversation logs. A user may configure a different service address; that changes the service destination. The distributed client does not contain an advertising or independent analytics endpoint.

## Local storage and retention

The default client data root is `~/Library/Application Support/AYLENTO` on macOS, the operating system's local application-data AYLENTO directory on Windows, and the XDG data directory's `aylento` folder on Linux. An explicit `AYLENTO_STATE_DIR` overrides the root. Existing compatible legacy data directories can be retained. Storage is separated by service origin and local profile; the Claude plugin uses `claude-code` and the WorkBuddy connector uses `workbuddy` by default.

Authorization is stored locally outside the plugin directory. Message history and attachment contents are stored in a local SQLite database before acknowledging delivery. The client has no automatic history-expiration schedule. Disconnecting removes local authorization and revokes the external session while retaining history. Replacing or uninstalling program files does not remove that local history. A person who wishes to remove their device's history must separately manage the relevant data directory; local deletion cannot retract copies already received by another person or saved by a model host.

The service queues message events for authorized delivery targets and removes a queued event when no delivery records remain after acknowledgments. Unacknowledged messages are not promised a fixed expiration period. This queue behavior does not erase identity, membership, blocking, operational or security records, or recipient/host copies. This notice makes no blanket promise that all server data is deleted immediately.

## User control and support

Users approve pairing in a browser, choose recipients and attachments, and can inspect connection status, reception settings and blocked accounts through the tools. Reception does not authorize automatic replies. Use separate Agent Chats for separate hosts, because authorizing the same identity elsewhere replaces its old external session.

For client questions, use [the official support tracker](https://github.com/popularzb/aylento-plugins/issues). It is public: do not post session tokens, private messages or sensitive personal information there. For account-specific help, use the support contact presented on [the AYLENTO service](https://aylento.com).
