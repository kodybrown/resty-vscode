import * as vscode from 'vscode';
import { RunCurrentTestCommand } from './commands/runCurrentTest';
import { RunAllTestsCommand } from './commands/runAllTests';
import { EditorTitleProvider } from './providers/editorTitleProvider';
import { ResultDisplayManager } from './utils/resultDisplay';
import { TempFileManager } from './utils/tempFileManager';

// Global instances
let runCurrentTestCommand: RunCurrentTestCommand;
let runAllTestsCommand: RunAllTestsCommand;
let editorTitleProvider: EditorTitleProvider;
let tempFileManager: TempFileManager;

/**
 * Extension activation function
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Resty VSCode extension is now active!');

  // Initialize components
  runCurrentTestCommand = new RunCurrentTestCommand();
  runAllTestsCommand = new RunAllTestsCommand();
  editorTitleProvider = new EditorTitleProvider(context);
  tempFileManager = new TempFileManager();

  // Register commands
  const runCurrentTest = vscode.commands.registerCommand(
    'resty.runCurrentTest',
    () => runCurrentTestCommand.execute()
  );

  const runAllTests = vscode.commands.registerCommand(
    'resty.runAllTests',
    () => runAllTestsCommand.execute()
  );

  // Activate providers
  editorTitleProvider.activate(context);

  // Register disposables
  context.subscriptions.push(
    runCurrentTest,
    runAllTests,
    editorTitleProvider
  );

  // Listen for configuration changes to refresh executor settings
  const configurationListener = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('resty')) {
      // Refresh configuration in command instances
      runCurrentTestCommand = new RunCurrentTestCommand();
      runAllTestsCommand = new RunAllTestsCommand();
    }
  });

  context.subscriptions.push(configurationListener);

  console.log('Resty commands and providers registered successfully');
}

/**
 * Extension deactivation function
 */
export async function deactivate() {
  console.log('Resty VSCode extension is being deactivated...');

  try {
    // Clean up result tabs
    await ResultDisplayManager.cleanup();

    // Clean up temporary files
    if (tempFileManager) {
      await tempFileManager.cleanup();
    }

    // Dispose of providers
    if (editorTitleProvider) {
      editorTitleProvider.dispose();
    }

    console.log('Resty extension cleanup completed');
  } catch (error) {
    console.error('Error during Resty extension cleanup:', error);
  }
}
