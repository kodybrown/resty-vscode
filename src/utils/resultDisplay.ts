import * as vscode from 'vscode';
import * as path from 'path';

export class ResultDisplayManager {
  private static resultTabs: vscode.TextEditor[] = [];

  /**
   * Displays test results in a new editor tab with appropriate syntax highlighting
   */
  static async displayResults(
    content: string,
    format: string,
    testContext: string,
    autoCloseOld: boolean = false
  ): Promise<void> {

    // Close old results if configured
    if (autoCloseOld) {
      await this.closeOldResultTabs();
    }

    // Determine language for syntax highlighting
    const language = this.getLanguageId(format);

    // Create document with results
    const doc = await vscode.workspace.openTextDocument({
      content: content,
      language: language
    });

    // Show in side panel
    const editor = await vscode.window.showTextDocument(doc, {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: true,
      preview: false
    });

    // Track this tab for cleanup
    this.resultTabs.push(editor);

    // Set custom tab title if possible
    // Note: VSCode doesn't provide direct API to set tab titles for untitled documents
    // This is a limitation we'll have to work with
  }

  /**
   * Maps output format to VSCode language ID
   */
  private static getLanguageId(format: string): string {
    switch (format.toLowerCase()) {
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      case 'html':
        return 'html';
      case 'markdown':
      case 'text':
      default:
        return 'markdown';
    }
  }

  /**
   * Closes old result tabs
   */
  private static async closeOldResultTabs(): Promise<void> {
    const tabsToClose = [...this.resultTabs];
    this.resultTabs = [];

    for (const editor of tabsToClose) {
      try {
        // Check if the editor is still active
        if (vscode.window.visibleTextEditors.includes(editor)) {
          const document = editor.document;

          // Only close if it's an untitled document (our result tab)
          if (document.isUntitled) {
            await vscode.window.showTextDocument(document);
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
          }
        }
      } catch (error) {
        // Ignore errors when closing tabs
        console.warn('Failed to close result tab:', error);
      }
    }
  }

  /**
   * Cleans up all tracked result tabs (called on extension deactivation)
   */
  static async cleanup(): Promise<void> {
    await this.closeOldResultTabs();
  }
}
