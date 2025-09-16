import * as vscode from 'vscode';
import * as path from 'path';
import { YamlBlockParser } from './yamlBlockParser';
import { RestyValidator } from '../utils/validation';

export class EditorTitleProvider {
  private parser = new YamlBlockParser();
  private validator = new RestyValidator();
  private disposables: vscode.Disposable[] = [];
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    // Create status bar item for displaying context
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    context.subscriptions.push(this.statusBarItem);
  }

  activate(context: vscode.ExtensionContext): void {
    // Listen for cursor position changes
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(this.onSelectionChanged.bind(this))
    );

    // Listen for active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(this.onActiveEditorChanged.bind(this))
    );

    // Initial update
    if (vscode.window.activeTextEditor) {
      this.updateEditorTitle(vscode.window.activeTextEditor);
    }

    context.subscriptions.push(...this.disposables);
  }

  private onSelectionChanged(event: vscode.TextEditorSelectionChangeEvent): void {
    this.updateEditorTitle(event.textEditor);
  }

  private onActiveEditorChanged(editor: vscode.TextEditor | undefined): void {
    if (editor) {
      this.updateEditorTitle(editor);
    } else {
      // Hide status bar item when no editor is active
      this.statusBarItem.hide();
    }
  }

  private updateEditorTitle(editor: vscode.TextEditor): void {
    if (!this.validator.isRestyFile(editor.document)) {
      this.statusBarItem.hide();
      return;
    }

    const position = editor.selection.active;
    const yamlBlock = this.parser.findYamlBlock(editor.document, position);
    const fileName = path.basename(editor.document.fileName);

    let title: string;

    if (yamlBlock && yamlBlock.isValid && yamlBlock.testName) {
      // In a valid test block - show file > test name
      title = `🧪 ${fileName} > ${yamlBlock.testName}`;
    } else {
      // Outside test blocks - show file name with test count
      const testCount = this.parser.countTestsInFile(editor.document);
      if (testCount > 0) {
        title = `🧪 ${fileName} (${testCount} tests)`;
      } else {
        title = `🧪 ${fileName}`;
      }
    }

    // Update status bar
    this.statusBarItem.text = title;
    this.statusBarItem.show();
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.statusBarItem.dispose();
  }
}
