import * as vscode from 'vscode';
import * as path from 'path';
import { YamlBlockParser } from '../providers/yamlBlockParser';
import { RestyValidator } from '../utils/validation';
import { TempFileManager } from '../utils/tempFileManager';
import { RestyExecutor } from '../utils/restyExecutor';
import { ResultDisplayManager } from '../utils/resultDisplay';
import { ErrorHandler } from '../utils/errorHandler';

export class RunCurrentTestCommand {
  private parser = new YamlBlockParser();
  private validator = new RestyValidator();
  private tempManager = new TempFileManager();
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

      // Find and validate YAML block
      const yamlBlock = this.parser.findYamlBlock(editor.document, editor.selection.active);
      const blockValidation = this.validator.validateYamlBlock(yamlBlock);

      if (!blockValidation.isValid) {
        ErrorHandler.showValidationError(blockValidation.message!);
        return;
      }

      const testName = yamlBlock!.testName || 'Unnamed Test';

      // Execute with progress indicator
      await ErrorHandler.withProgress(
        `Running test: ${testName}`,
        async (progress, token) => {
          try {
            // Create temp file
            progress.report({ message: 'Creating temporary test file...' });
            const tempFile = await this.tempManager.createTempTestFile(yamlBlock!.content);

            // Check for cancellation
            if (token.isCancellationRequested) {
              await this.tempManager.cleanupFile(tempFile);
              return;
            }

            // Execute test
            progress.report({ message: 'Executing test...' });
            const config = this.executor.getConfig();
            const result = await this.executor.executeResty(tempFile, config.defaultOutputFormat);

            // Clean up temp file
            await this.tempManager.cleanupFile(tempFile);

            // Check for cancellation
            if (token.isCancellationRequested) {
              return;
            }

            // Display results
            progress.report({ message: 'Displaying results...' });
            await ResultDisplayManager.displayResults(
              result.stdout,
              config.defaultOutputFormat,
              testName,
              config.autoCloseOldResults
            );

            // Show success message if configured
            if (config.showOutputOnRun && result.exitCode === 0) {
              ErrorHandler.showInfo(`Test '${testName}' completed successfully.`);
            }

          } catch (error) {
            // Clean up temp file on error
            await this.tempManager.cleanup();
            throw error;
          }
        }
      );

    } catch (error) {
      ErrorHandler.handleExecutionError(error);
    }
  }
}
