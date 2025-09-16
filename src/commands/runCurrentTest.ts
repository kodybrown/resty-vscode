import * as vscode from 'vscode';
import * as path from 'path';
import { YamlBlockParser } from '../providers/yamlBlockParser';
import { RestyValidator } from '../utils/validation';
import { TempFileManager } from '../utils/tempFileManager';
import { RestyExecutor } from '../utils/restyExecutor';
import { ResultDisplayManager } from '../utils/resultDisplay';
import { ErrorHandler } from '../utils/errorHandler';
import { TestDependencyResolver } from '../utils/testDependencyResolver';
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

      // Find all blocks and resolve dependencies
      const allBlocks = this.parser.findAllYamlBlocks(editor.document);
      const dependencyResolver = new TestDependencyResolver(allBlocks);
      const resolution = dependencyResolver.resolveExecutionOrder(targetTestName);

      if (resolution.error) {
        ErrorHandler.showValidationError(resolution.error);
        return;
      }

      const executionBlocks = resolution.blocks;
      const hasDependendencies = executionBlocks.length > 1;
      const progressTitle = hasDependendencies 
        ? `Running test: ${targetTestName} (with dependencies)`
        : `Running test: ${targetTestName}`;

      // Execute with progress indicator
      await ErrorHandler.withProgress(
        progressTitle,
        async (progress, token) => {
          try {
            // Create combined temp file with all required blocks
            progress.report({ message: 'Creating temporary test file...' });
            const combinedContent = this.createCombinedTestFile(executionBlocks);
            const tempFile = await this.tempManager.createTempTestFile(combinedContent);

            // Check for cancellation
            if (token.isCancellationRequested) {
              await this.tempManager.cleanupFile(tempFile);
              return;
            }

            // Execute tests
            const blockDescriptions = this.getBlockDescriptions(executionBlocks, targetTestName);
            progress.report({ message: `Executing: ${blockDescriptions}` });
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
              targetTestName,
              config.autoCloseOldResults
            );

            // Show success message if configured
            if (config.showOutputOnRun && result.exitCode === 0) {
              const message = hasDependendencies 
                ? `Test '${targetTestName}' and its dependencies completed successfully.`
                : `Test '${targetTestName}' completed successfully.`;
              ErrorHandler.showInfo(message);
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

  /**
   * Creates a combined test file with all execution blocks
   */
  private createCombinedTestFile(blocks: YamlBlock[]): string {
    const sections: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Add a comment header for clarity
      if (block.blockType === 'variables') {
        sections.push(`# Variables Block`);
      } else if (block.blockType === 'include') {
        sections.push(`# Include Block`);
      } else if (block.blockType === 'test') {
        sections.push(`# Test: ${block.testName}`);
      }
      
      // Add the YAML content in a code block
      sections.push('```yaml');
      sections.push(block.content);
      sections.push('```');
      sections.push(''); // Empty line between blocks
    }

    return sections.join('\n');
  }

  /**
   * Creates a human-readable description of blocks being executed
   */
  private getBlockDescriptions(blocks: YamlBlock[], targetTestName: string): string {
    if (blocks.length === 1) {
      return targetTestName;
    }

    const descriptions: string[] = [];
    const variableCount = blocks.filter(b => b.blockType === 'variables').length;
    const includeCount = blocks.filter(b => b.blockType === 'include').length;
    const testBlocks = blocks.filter(b => b.blockType === 'test');
    const dependencyTests = testBlocks.filter(b => b.testName !== targetTestName);

    if (variableCount > 0) {
      descriptions.push(`${variableCount} variable block${variableCount > 1 ? 's' : ''}`);
    }
    if (includeCount > 0) {
      descriptions.push(`${includeCount} include block${includeCount > 1 ? 's' : ''}`);
    }
    if (dependencyTests.length > 0) {
      descriptions.push(`${dependencyTests.length} dependency test${dependencyTests.length > 1 ? 's' : ''}`);
    }
    descriptions.push(`target test (${targetTestName})`);

    return descriptions.join(', ');
  }
}
