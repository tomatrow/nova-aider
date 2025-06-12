# Aider

[Aider](https://aider.chat) integration for Nova

## Overview

This Nova extension provides seamless integration with Aider, an AI pair programming tool. It allows you to chat with AI about your code directly from within Nova, with full context awareness of your project files.

## Features

- **Context-aware AI chat**: The extension automatically provides Aider with context about your open files and project structure
- **File management**: View and manage which files are included in your Aider session (editable or read-only)
- **Code snippets**: Select code snippets in Nova and include them in your Aider conversations
- **Git integration**: Respects your `.gitignore` settings
- **Real-time sync**: Changes made by Aider are reflected immediately in Nova

## Setup

### Prerequisites

Install [`uv`](https://github.com/astral-sh/uv) - Python package manager

### Installation

1. Install the Aider extension for Nova from the Extension Library
2. Open a project in Nova
3. Run the `Copy start script to clipboard` command from the Command Palette
4. Open your terminal and navigate to your project directory
5. Paste and run the copied command:

```shell
cd path/to/nova/project
# paste command, e.g.:
uv run --python python3.12 --with aider-chat '/Users/ajcaldwell/Library/Application Support/Nova/Extensions/dev.ajcaldwell.aider/nova-aider.py'
```

## Usage

### Starting a Session

1. Follow the setup steps above to start the Aider server
2. The extension will automatically connect and show your project context in the sidebar
3. Use Nova's command palette to send messages to Aider

### Managing Files

The extension provides a context tree in the sidebar showing:

- **Editable files**: Files that Aider can modify
- **Read-only files**: Files that Aider can read but not modify
- **Suggested files**: Files that Aider recommends adding to the session
- **Snippets**: Snippets added to the aider session

### Working with Code Snippets

1. Select code in any open file
2. Use `Add to context` command (cmd-l)
3. The selected snippet will be available to include in your Aider conversations
4. Snippets show the file name and line range for context

### Commands

Available through Nova's Command Palette:

- `Chat with selection` (cmd-k) - Chat with aider about the selected text
- `Add to context` (cmd-l) - Add snippet to aider context
- `Copy start script to clipboard` - Get the command to start the Aider server
- `Refresh gitignored files` - Update extension with currently ignored files

## Configuration

The extension automatically:

- Respects your project's `.gitignore` file
- Tracks open files in Nova
- Maintains sync between Nova and Aider sessions

## Troubleshooting

### Getting Help

- Check the [Aider documentation](https://aider.chat) for general usage
- Report extension-specific issues on the project repository
