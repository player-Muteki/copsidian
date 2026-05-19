# Copsidian

Embed the complete OpenCode agent inside Obsidian sidebar.

## Features

- Full OpenCode agent integration in Obsidian
- Stream rendering with markdown, thinking blocks, tool calls, and plan panels
- Session management with persistence
- Context system: @mention notes, resolver, injection
- Sync engine: tool call results synced to vault
- Keyboard shortcuts: Ctrl+N (new session), Ctrl+L (clear), Ctrl+Shift+C (copy)
- Smart auto-scroll with "New messages" button
- Drag & drop files and images
- Session search and message timestamps
- Diff rendering for edit tool calls
- Code block copy buttons
- Wikilink injection for vault file paths
- Auto-reconnect on ACP process crash
- Request timeout (5 minutes)
- Session data limits with configurable retention

## Installation

### BRAT (Recommended)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Open BRAT settings → "Add Beta Plugin"
3. Enter this repository URL
4. Click "Add Plugin"

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create folder `.obsidian/plugins/copsidian/` in your vault
3. Copy the three files into that folder
4. Enable the plugin in Obsidian settings

## Configuration

### OpenCode CLI Path

Path to the `opencode` executable. Use `opencode` if it's in your PATH, or provide full path like `/usr/local/bin/opencode`.

### Permission Mode

- **Yolo**: Auto-approve all tool permissions
- **Plan**: Auto-approve safe operations (read, search), reject others
- **Safe**: Confirm all permissions

### Session Limits

- **Max Messages per Session**: Truncate when exceeded (default 200)
- **Session Retention Days**: Remove empty sessions older than this (default 30)

### Sync Rules

Configure how tool call results are synced to your vault as notes.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development build (watch mode)
npm run dev
```

### Build Commands

- `npm run build` - Production build
- `npm run dev` - Development build with watch
- `npm run check` - TypeScript strict check

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + N | New session |
| Ctrl/Cmd + L | Clear screen |
| Ctrl/Cmd + Shift + C | Copy last assistant message |
| Enter | Send message |
| Escape | Stop generation |
| @ | Reference a note |
| / | Slash commands |

## License

MIT
