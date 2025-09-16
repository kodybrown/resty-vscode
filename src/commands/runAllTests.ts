import * as vscode from 'vscode';
import * as path from 'path';
import { RestyValidator } from '../utils/validation';
import { RestyExecutor } from '../utils/restyExecutor';
import { ResultDisplayManager } from '../utils/resultDisplay';
import { ErrorHandler } from '../utils/errorHandler';

export class RunAllTestsCommand {
  private validator = new RestyValidator();
  private executor = new RestyExecutor();

  async execute(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    try {
      // Validate file type
      const fileValidation = this.validator.validateRestyFile(editor.document);
      if (!fileValidation.isValid) {
        ErrorHandler.showValidationError(fileValidation.message!);
        return;
      }

      // Check if file needs saving
      if (editor.document.isDirty) {
        const shouldSave = await vscode.window.showWarningMessage(
          'File has unsaved changes. Save before running tests?',
          'Save and Run',
          'Cancel'
        );

        if (shouldSave === 'Save and Run') {
          await editor.document.save();
        } else {
          return;
        }
      }

      const fileName = path.basename(editor.document.fileName);

      // Execute with progress indicator
      await ErrorHandler.withProgress(
        `Running all tests in ${fileName}`,
        async (progress, token) => {
          try {
            // Execute tests
            progress.report({ message: 'Executing tests...' });
            const config = this.executor.getConfig();
            const result = await this.executor.executeResty(
              editor.document.fileName,
              config.defaultOutputFormat
            );

            // Check for cancellation
            if (token.isCancellationRequested) {
              return;
            }

            // Display results
            progress.report({ message: 'Displaying results...' });
            await ResultDisplayManager.displayResults(
              result.stdout,
              config.defaultOutputFormat,
              `All tests in ${fileName}`,
              config.autoCloseOldResults
            );

            // Show success message if configured
            if (config.showOutputOnRun && result.exitCode === 0) {
              ErrorHandler.showInfo(`All tests in '${fileName}' completed successfully.`);
            }

          } catch (error) {
            throw error;
          }
        }
      );

    } catch (error) {
      ErrorHandler.handleExecutionError(error);
    }
  }
}
