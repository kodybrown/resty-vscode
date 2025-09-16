import * as vscode from 'vscode';
import { ErrorType } from '../types';

export class ErrorHandler {

  /**
   * Handles execution errors and shows appropriate user messages
   */
  static handleExecutionError(error: any): void {
    const errorMessage = error.message || error.toString();

    if (errorMessage.includes(ErrorType.BINARY_NOT_FOUND)) {
      vscode.window.showErrorMessage(
        'Resty executable not found. Please check your settings.',
        'Open Settings'
      ).then(selection => {
        if (selection === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'resty.executablePath');
        }
      });
    } else if (errorMessage.includes(ErrorType.CIRCULAR_DEPENDENCY)) {
      vscode.window.showErrorMessage(`Circular dependency detected: ${this.extractErrorMessage(errorMessage)}`);
    } else if (errorMessage.includes(ErrorType.MISSING_DEPENDENCY)) {
      vscode.window.showErrorMessage(`Missing dependency: ${this.extractErrorMessage(errorMessage)}`);
    } else if (errorMessage.includes(ErrorType.DEPENDENCY_FAILED)) {
      vscode.window.showErrorMessage(`Dependency test failed: ${this.extractErrorMessage(errorMessage)}`);
    } else if (errorMessage.includes(ErrorType.EXECUTION_FAILED)) {
      vscode.window.showErrorMessage(`Resty execution failed: ${this.extractErrorMessage(errorMessage)}`);
    } else if (errorMessage.includes('exit code')) {
      vscode.window.showErrorMessage(`Resty execution failed: ${errorMessage}`);
    } else {
      vscode.window.showErrorMessage(`Unexpected error: ${this.extractErrorMessage(errorMessage)}`);
    }
  }

  /**
   * Shows validation error messages to the user
   */
  static showValidationError(message: string): void {
    vscode.window.showWarningMessage(message);
  }

  /**
   * Shows information messages to the user
   */
  static showInfo(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  /**
   * Extracts clean error message from error string
   */
  private static extractErrorMessage(errorMessage: string): string {
    // Remove error type prefixes
    const cleanMessage = errorMessage
      .replace(new RegExp(`^${ErrorType.BINARY_NOT_FOUND}:\\s*`), '')
      .replace(new RegExp(`^${ErrorType.EXECUTION_FAILED}:\\s*`), '')
      .replace(new RegExp(`^${ErrorType.INVALID_TEST}:\\s*`), '')
      .replace(new RegExp(`^${ErrorType.NOT_TEST_BLOCK}:\\s*`), '')
      .replace(new RegExp(`^${ErrorType.NO_YAML_BLOCK}:\\s*`), '')
      .replace(new RegExp(`^${ErrorType.INVALID_FILE}:\\s*`), '')
      .replace(new RegExp(`^${ErrorType.CIRCULAR_DEPENDENCY}:\\s*`), '')
      .replace(new RegExp(`^${ErrorType.MISSING_DEPENDENCY}:\\s*`), '')
      .replace(new RegExp(`^${ErrorType.DEPENDENCY_FAILED}:\\s*`), '');

    return cleanMessage.trim();
  }

  /**
   * Shows progress message with cancellation support
   */
  static async withProgress<T>(
    title: string,
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>
  ): Promise<T> {
    return vscode.window.withProgress({
      location: vscode.ProgressLocation.Window,
      title: title,
      cancellable: true
    }, task);
  }
}
