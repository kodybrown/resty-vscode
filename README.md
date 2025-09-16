# Resty - VSCode Extension

Run [Resty](https://github.com/kodybrown/resty) API tests directly from VSCode with beautiful markdown-formatted results.

## Features

✨ **Smart Test Detection** - Automatically detects YAML test blocks in `.resty` and `.rest` files
🚀 **Run Single Tests** - Execute the test block under your cursor with `Ctrl+R`
📁 **Run All Tests** - Execute all tests in the current file with `Ctrl+Shift+R`
🎯 **Dynamic Context Display** - Shows current test name in status bar
📋 **Side-by-Side Results** - Opens results in a new tab with proper syntax highlighting
🔗 **Clickable Error Links** - Click errors to jump directly to the source line
⚙️ **Configurable** - Customize executable path, output format, and behavior

## Installation

1. Install the [Resty CLI tool](https://github.com/kodybrown/resty)
2. Install this extension from the VSCode marketplace
3. Configure the Resty executable path if needed

## Usage

### Quick Start

1. Open a `.resty` or `.rest` file
2. Place your cursor inside a YAML test block
3. Press `Ctrl+R` to run the current test
4. Press `Ctrl+Shift+R` to run all tests in the file

### Dynamic Context Display

The status bar shows your current location:
- `🧪 auth.resty > login_test` - Inside a test block
- `🧪 auth.resty (3 tests)` - Outside test blocks

### Commands

- **Resty: Run Current Test** (`Ctrl+R`) - Run the test block under cursor
- **Resty: Run All Tests** (`Ctrl+Shift+R`) - Run all tests in current file

### Context Menu

Right-click in `.resty`/`.rest` files to access Resty commands.

## Configuration

| Setting                     | Description                               | Default    |
| --------------------------- | ----------------------------------------- | ---------- |
| `resty.executablePath`      | Path to Resty executable                  | `resty`    |
| `resty.defaultOutputFormat` | Output format (markdown, json, xml, html) | `markdown` |
| `resty.showOutputOnRun`     | Show output automatically                 | `true`     |
| `resty.autoCloseOldResults` | Close previous result tabs                | `false`    |
| `resty.tempFileCleanup`     | Clean up temporary files                  | `true`     |

## Requirements

- [Resty CLI tool](https://github.com/kodybrown/resty) must be installed and available in PATH or configured via `resty.executablePath`
- VSCode 1.74.0 or higher

## Supported File Types

- `.resty` files
- `.rest` files

Both use the same format: Markdown with embedded YAML test blocks.

## Output Formats

Results are displayed with appropriate syntax highlighting:

- **Markdown** (default) - Rich formatting with clickable links
- **JSON** - Structured test results
- **XML** - JUnit-compatible format
- **HTML** - Interactive report (opens in browser preview)

## Example Test File

```markdown
# API Tests

## Authentication

```yaml
test: login
post: https://api.example.com/auth
body: |
  {
    "username": "admin",
    "password": "secret"
  }
success:
  token: $.access_token
``    <-- only using two backticks here to avoid ending the example markdown block

## Protected Endpoints

```yaml
test: get_profile
get: https://api.example.com/profile
authorization: Bearer $token
``    <-- only using two backticks here to avoid ending the example markdown block
```

## Troubleshooting

### "Resty executable not found"

- Ensure Resty is installed: `dotnet tool install -g resty`
- Or set `resty.executablePath` to the full path of the executable

### "Cursor is not in a YAML code block"

- Place your cursor inside a ````yaml` block with a `test:` key
- Make sure the file extension is `.resty` or `.rest`

### Results not showing

- Check that `resty.showOutputOnRun` is enabled
- Verify the Resty executable runs correctly from terminal

## Contributing

Found a bug or have a feature request? Please open an issue on the [GitHub repository](https://github.com/kodybrown/resty).

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Enjoy testing your APIs with Resty!** 🚀
