# Resty - VSCode Extension

Run [Resty](https://github.com/kodybrown/resty) API tests directly from VSCode with beautiful markdown-formatted results.

## Features

✨ **Smart Test Detection** - Automatically detects YAML test blocks in `.resty` and `.rest` files
🚀 **Run Single Test** - Execute the test block under your cursor with `Ctrl+Alt+R`
📁 **Run All Tests** - Execute all tests in the current file with `Ctrl+Shift+Alt+R`
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
3. Press `Ctrl+Alt+R` to run the current test
4. Press `Ctrl+Shift+Alt+R` to run all tests in the file

### Dynamic Context Display

The status bar shows your current location:
- `🧪 auth.resty > login_test` - Inside a test block
- `🧪 auth.resty (3 tests)` - Outside test blocks

### Commands

- **Resty: Run Current Test** (`Ctrl+Alt+R`) - Run the test block under cursor
- **Resty: Run All Tests** (`Ctrl+Shift+Alt+R`) - Run all tests in current file

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

## Test Dependencies

### The `requires` Property

You can specify test dependencies using the `requires` property. When running a single test, all required dependencies will be executed first in the correct order:

```yaml
test: get_user_profile
requires: [login_test, setup_user]  # These tests run first
get: https://api.example.com/profile
authorization: Bearer $auth_token
```

The `requires` property accepts:
- A single test name: `requires: login_test`
- An array of test names: `requires: [login_test, setup_user]`

### Variables and Include Blocks

Use `variables:` or `include:` blocks to define shared variables that all tests in the file can access:

```yaml
# This block runs automatically before any test
variables:
  base_url: https://api.example.com
  admin_user: admin@example.com
```

```yaml
# Include external files or configurations
include:
  - common_variables.yaml
  - auth_config.yaml
```

**Key Features**:
- Variables and include blocks are **automatically executed** before any test in the file
- They run in file order (top to bottom)
- Perfect for setting up authentication tokens, base URLs, and shared configuration

## Example Test File

```markdown
# API Test Suite

## Shared Configuration

```yaml
variables:
  base_url: https://api.example.com
  admin_email: admin@example.com
  test_user_id: 12345
``    <-- only using two backticks here to avoid ending the example markdown block

## Authentication Setup

```yaml
test: login
post: $base_url/auth
body: |
  {
    "username": "admin",
    "password": "secret"
  }
success:
  auth_token: $.access_token
  user_id: $.user.id
``    <-- only using two backticks here to avoid ending the example markdown block

## User Management

```yaml
test: create_test_user
requires: login  # Needs auth token from login test
post: $base_url/users
authorization: Bearer $auth_token
body: |
  {
    "email": "test@example.com",
    "name": "Test User"
  }
success:
  created_user_id: $.user.id
``    <-- only using two backticks here to avoid ending the example markdown block

## Profile Operations

```yaml
test: get_user_profile
requires: [login, create_test_user]  # Needs both auth and user creation
get: $base_url/users/$created_user_id
authorization: Bearer $auth_token
expect:
  status: 200
  body:
    email: test@example.com
``    <-- only using two backticks here to avoid ending the example markdown block

## Cleanup

```yaml
test: delete_test_user
requires: [login, create_test_user]  # Cleanup depends on both
delete: $base_url/users/$created_user_id
authorization: Bearer $auth_token
expect:
  status: 204
``    <-- only using two backticks here to avoid ending the example markdown block
```

## Dependency Behavior

### Running Individual Tests

When you run a single test (`Ctrl+Alt+R`):
1. The extension delegates dependency resolution to the Resty CLI
2. The CLI automatically includes all required dependencies
3. Variables are preserved between all blocks, so auth tokens flow correctly
4. Clear error messages are shown for missing or circular dependencies

### Running All Tests

When you run all tests (`Ctrl+Shift+Alt+R`):
- Tests run in file order (top to bottom)
- Variables and include blocks run when encountered
- Dependencies are ignored since all tests will run anyway

### Error Handling

- **Missing dependency**: Clear error if a required test doesn't exist
- **Circular dependency**: Detects infinite loops (e.g., A requires B, B requires A)
- **Failed dependency**: If any required test fails, the target test won't run

### Execution Examples

**File contains**:

```yaml
variables: { base_url: ... }
test: login
test: create_user (requires: login)
test: get_profile (requires: [login, create_user])
test: cleanup (requires: create_user)
```

**Running `get_profile` individually executes**:
1. variables block
2. login test
3. create_user test
4. get_profile test (target)

**Running all tests executes**:
1. variables block
2. login test
3. create_user test
4. get_profile test
5. cleanup test

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

### "Missing dependency" errors

- Check test names match exactly (case-sensitive)
- Ensure the required test exists in the same file
- Verify the required test has a valid `test:` key

### "Circular dependency detected"

- Review your `requires` chains for loops (e.g., A → B → C → A)
- Simplify dependency chains where possible
- Consider using variables blocks instead of test dependencies for shared setup

### Dependencies not running

- Make sure you're running a single test (`Ctrl+Alt+R`), not all tests
- Verify the target test has a `requires:` property
- Check that dependency test names are spelled correctly

## Contributing

Found a bug or have a feature request? Please open an issue on the [GitHub repository](https://github.com/kodybrown/resty).

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Enjoy testing your APIs with Resty!** 🚀
