import * as vscode from 'vscode';
import { YamlBlock, ValidationResult, ErrorType } from '../types';

export class RestyValidator {

  /**
   * Validates a YAML block to ensure it's a proper Resty test
   */
  validateYamlBlock(yamlBlock: YamlBlock | null): ValidationResult {
    if (!yamlBlock) {
      return {
        isValid: false,
        errorType: ErrorType.NO_YAML_BLOCK,
        message: 'Cursor is not in a YAML code block.'
      };
    }

    if (!yamlBlock.hasTestKey) {
      return {
        isValid: false,
        errorType: ErrorType.NOT_TEST_BLOCK,
        message: 'Cursor is in a YAML block, but it does not appear to be a Resty test block.'
      };
    }

    if (!yamlBlock.isValid) {
      return {
        isValid: false,
        errorType: ErrorType.INVALID_TEST,
        message: 'Invalid YAML or missing HTTP method (get, post, put, etc.).'
      };
    }

    return { isValid: true };
  }

  /**
   * Validates that the current file is a Resty file (.resty or .rest)
   */
  validateRestyFile(document: vscode.TextDocument): ValidationResult {
    const fileName = document.fileName;
    const isRestyFile = fileName.endsWith('.resty') || fileName.endsWith('.rest');

    if (!isRestyFile) {
      return {
        isValid: false,
        errorType: ErrorType.INVALID_FILE,
        message: 'Current file is not a .resty or .rest file.'
      };
    }

    return { isValid: true };
  }

  /**
   * Simple helper to check if a document is a Resty file
   */
  isRestyFile(document: vscode.TextDocument): boolean {
    return document.fileName.endsWith('.resty') || document.fileName.endsWith('.rest');
  }
}
