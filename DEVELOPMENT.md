# Development Guide - Resty VSCode Extension

This document provides comprehensive information for developers working on the Resty VSCode extension.

## Prerequisites

### Required Software

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) - Package manager
- **TypeScript** (installed via npm) - Language compiler
- **Visual Studio Code** (v1.74.0 or higher) - Development environment
- **Resty CLI Tool** - The underlying tool this extension integrates with

### Verify Prerequisites

```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if Resty is installed
resty --version

# Check VSCode version
code --version
```

## Project Setup

### 1. Clone and Install Dependencies

```powershell
# Navigate to the extension directory
cd ~\Resty.VSCode

# Install all dependencies
npm install

# Verify installation
npm list
```

### 2. Development Dependencies

The project uses these key development dependencies:

| Package          | Version | Purpose                      |
| ---------------- | ------- | ---------------------------- |
| `@types/vscode`  | ^1.74.0 | VSCode API type definitions  |
| `@types/node`    | 16.x    | Node.js type definitions     |
| `@types/js-yaml` | ^4.0.5  | YAML parser type definitions |
| `typescript`     | ^4.9.4  | TypeScript compiler          |

### 3. Runtime Dependencies

| Package   | Version | Purpose                               |
| --------- | ------- | ------------------------------------- |
| `js-yaml` | ^4.1.0  | YAML parsing for test block detection |

## Build Process

### Development Build

```powershell
# Compile TypeScript to JavaScript
npm run compile

# Watch mode - recompiles on file changes
npm run watch
```

### Build Output

The TypeScript compiler outputs JavaScript files to the `out/` directory:

```
out/
├── commands/
│   ├── runCurrentTest.js
│   └── runAllTests.js
├── providers/
│   ├── yamlBlockParser.js
│   └── editorTitleProvider.js
├── utils/
│   ├── validation.js
│   ├── restyExecutor.js
│   ├── tempFileManager.js
│   ├── resultDisplay.js
│   └── errorHandler.js
├── types/
│   └── index.js
└── extension.js        # Main entry point
```

### Source Maps

Source maps (`.js.map` files) are generated for debugging support, mapping the compiled JavaScript back to the original TypeScript source.

## Testing & Development

### 1. Launch Extension Development Host

```powershell
# Open the extension project in VSCode
code .

# Press F5 or use the Run command
# This launches a new VSCode window with the extension loaded
```

### 2. Testing in Development Host

1. **Open a test file**: Create or open a `.resty` or `.rest` file
2. **Test commands**:
   - `Ctrl+Alt+R` - Run Current Test
   - `Ctrl+Shift+Alt+R` - Run All Tests
3. **Check status bar**: Should show dynamic context
4. **Verify settings**: Go to Settings and search for "resty"

### 3. Debug the Extension

- **Set breakpoints** in TypeScript source files
- **Use Debug Console** in the main VSCode window
- **View logs** in the Extension Development Host's Output panel

### 4. Reload Extension During Development

When you make changes:
1. **Recompile**: `npm run compile` (or use watch mode)
2. **Reload Extension Host**: `Ctrl+Shift+F5` or Developer: Reload Window

## Project Structure

### Source Code Organization

```
src/
├── commands/                   # Command implementations
│   ├── runCurrentTest.ts       # Single test execution
│   └── runAllTests.ts          # All tests execution
├── providers/                  # VSCode providers and parsers
│   ├── yamlBlockParser.ts      # YAML block detection
│   └── editorTitleProvider.ts  # Status bar context
├── utils/                      # Utility modules
│   ├── validation.ts           # Input validation
│   ├── restyExecutor.ts        # Resty binary execution
│   ├── tempFileManager.ts      # Temporary file handling
│   ├── resultDisplay.ts        # Result display management
│   └── errorHandler.ts         # Error handling utilities
├── types/                      # TypeScript type definitions
│   └── index.ts                # Shared interfaces and enums
└── extension.ts                # Main extension entry point
```

### Configuration Files

| File             | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `package.json`   | Extension manifest and npm configuration |
| `tsconfig.json`  | TypeScript compiler configuration        |
| `.vscodeignore`  | Files excluded from extension package    |
| `README.md`      | User documentation                       |
| `DEVELOPMENT.md` | This development guide                   |

## Package Configuration

### Extension Manifest (`package.json`)

Key sections explained:

#### Activation Events
```json
"activationEvents": [
  "onLanguage:markdown"
]
```
The extension activates when a Markdown file is opened (covers `.resty`/`.rest` files).

#### Commands
```json
"commands": [
  {
    "command": "resty.runCurrentTest",
    "title": "Run Current Test",
    "category": "Resty",
    "icon": "$(play)"
  }
]
```
Defines available commands with titles and icons.

#### Configuration
```json
"configuration": {
  "title": "Resty",
  "properties": {
    "resty.executablePath": {
      "type": "string",
      "default": "resty"
    }
  }
}
```
Defines user-configurable settings.

## Architecture Patterns

### Command Pattern

Each major operation (Run Current Test, Run All Tests) is implemented as a separate command class with an `execute()` method.

### Provider Pattern

Specialized providers handle specific VSCode integrations:
- `YamlBlockParser` - Detects and validates test blocks
- `EditorTitleProvider` - Updates status bar context

### Utility Pattern

Shared functionality is organized into focused utility classes:
- `RestyValidator` - Input validation logic
- `RestyExecutor` - Binary execution and path resolution
- `TempFileManager` - Temporary file lifecycle management
- `ErrorHandler` - Centralized error handling and user messaging

### Dependency Injection

Services are injected into commands rather than using globals, making the code more testable and maintainable.

## Error Handling Strategy

### Validation Errors

- **User-friendly messages** for common mistakes
- **Specific guidance** for resolution (e.g., "Place cursor in YAML block")
- **Warning dialogs** for non-blocking issues

### Execution Errors

- **Binary not found**: Opens settings with helpful message
- **Execution failure**: Shows command output and exit code
- **Cancellation support**: Handles user-initiated cancellation

### Resource Management

- **Automatic cleanup** of temporary files
- **Proper disposal** of VSCode resources
- **Error recovery** in failure scenarios

## Performance Considerations

### Lazy Loading

- Extension only activates when needed (Markdown files)
- Heavy operations are async with progress indicators
- Resources are created on-demand

### Memory Management

- Temporary files are tracked and cleaned up
- Event listeners are properly disposed
- Result tabs can be auto-closed to prevent accumulation

### Caching

- Configuration is cached and refreshed only when changed
- YAML parsing results are not cached (files may change frequently)

## Publishing Workflow

### 1. Prepare for Publishing

```powershell
# Install VSCE (Visual Studio Code Extension manager)
npm install -g @vscode/vsce

# Package the extension
vsce package

# This creates resty-vscode-0.1.0.vsix
```

### 2. Test the Package

```powershell
# Install the packaged extension locally
code --install-extension resty-vscode-0.1.0.vsix

# Test in a fresh VSCode window
code --new-window
```

### 3. Publish to Marketplace

```powershell
# Login to Visual Studio Marketplace
vsce login kodybrown

# Publish the extension
vsce publish
```

## Troubleshooting

### Common Development Issues

#### "Cannot find module 'js-yaml'"

```powershell
npm install
npm run compile
```

#### "Extension not loading in Development Host"

- Check the Output panel for activation errors
- Verify `package.json` syntax is valid
- Ensure `main` entry point exists: `./out/extension.js`

#### "Commands not appearing"

- Verify commands are registered in `package.json`
- Check activation events are triggering
- Confirm `when` clauses are correct for file types

#### "TypeScript compilation errors"

- Check `tsconfig.json` configuration
- Verify all imports have correct paths
- Ensure type definitions are installed

### Debugging Tips

1. **Use console.log()** liberally during development
2. **Check Extension Host's Output** panel for errors
3. **Set breakpoints** in TypeScript source (not compiled JS)
4. **Test with various file types** and edge cases
5. **Verify settings** are being read correctly

## Contributing

### Code Style

- Use **TypeScript strict mode**
- Follow **VSCode extension patterns**
- Include **comprehensive error handling**
- Add **JSDoc comments** for public methods
- Use **async/await** for asynchronous operations

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request with description

## Additional Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [VSCode Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Resty CLI Documentation](https://github.com/kodybrown/resty)

---

**Happy developing!** 🚀
