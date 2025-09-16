import * as vscode from 'vscode';
import * as path from 'path';
import { YamlBlockParser } from '../providers/yamlBlockParser';
import { RestyValidator } from '../utils/validation';
import { TempFileManager } from '../utils/tempFileManager';
import { RestyExecutor } from '../utils/restyExecutor';
import { ResultDisplayManager } from '../utils/resultDisplay';
import { ErrorHandler } from '../utils/errorHandler';
import { YamlBlock } from '../types';

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

      // Find and validate current YAML block
      const currentBlock = this.parser.findYamlBlock(editor.document, editor.selection.active);
      const blockValidation = this.validator.validateYamlBlock(currentBlock);

      if (!blockValidation.isValid) {
        ErrorHandler.showValidationError(blockValidation.message!);
        return;
      }

      // Ensure it's a test block
      if (currentBlock!.blockType !== 'test' || !currentBlock!.testName) {
        ErrorHandler.showValidationError('Current block is not a test block. Place cursor in a YAML block with a test: key.');
        return;
      }

      const targetTestName = currentBlock!.testName;

      const progressTitle = `Running test: ${targetTestName}`;

      // Execute with progress indicator
      await ErrorHandler.withProgress(
        progressTitle,
        async (progress, token) => {
          try {
            // Execute test using CLI with dependency resolution
            progress.report({ message: `Executing test: ${targetTestName}` });
            const config = this.executor.getConfig();
            const result = await this.executor.executeRestyWithTest(
              editor.document.fileName,
              targetTestName,
              config.defaultOutputFormat
            );

            // Check for cancellation
            if (token.isCancellationRequested) {
              return;
            }

            // Handle CLI errors (dependency resolution errors)
            if (result.exitCode === 3) {
              ErrorHandler.showValidationError('Missing test dependency: ' + result.stderr.trim());
              return;
            }
            if (result.exitCode === 4) {
              ErrorHandler.showValidationError('Circular test dependency: ' + result.stderr.trim());
              return;
            }

            // Display results
            progress.report({ message: 'Displaying results...' });
            await ResultDisplayManager.displayResults(
              result.stdout,
              config.defaultOutputFormat,
              targetTestName,
              config.autoCloseOldResults
            );

            // Show success message if configured
            if (config.showOutputOnRun && result.exitCode === 0) {
              ErrorHandler.showInfo(`Test '${targetTestName}' completed successfully.`);
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
