import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { YamlBlock } from '../types';

export class YamlBlockParser {

  /**
   * Finds the YAML block containing the given position
   */
  findYamlBlock(document: vscode.TextDocument, position: vscode.Position): YamlBlock | null {
    const lines = document.getText().split('\n');
    let blockStart = -1;
    let blockEnd = -1;

    // Find containing ```yaml...``` block
    for (let i = position.line; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('```yaml')) {
        blockStart = i;
        break;
      }
    }

    if (blockStart >= 0) {
      for (let i = position.line; i < lines.length; i++) {
        if (lines[i].trim() === '```') {
          blockEnd = i;
          break;
        }
      }
    }

    if (blockStart >= 0 && blockEnd > blockStart) {
      const content = lines.slice(blockStart + 1, blockEnd).join('\n');
      return this.parseYamlContent(content, blockStart, blockEnd);
    }

    return null;
  }

  /**
   * Parses YAML content and determines block type and validity
   */
  private parseYamlContent(content: string, startLine: number, endLine: number): YamlBlock {
    let testName: string | undefined;
    let hasTestKey = false;
    let isValid = false;
    let blockType: 'test' | 'variables' | 'include' = 'test';

    try {
      const parsed = yaml.load(content);

      if (parsed && typeof parsed === 'object') {
        const obj = parsed as any;
        hasTestKey = 'test' in obj;
        testName = obj.test;

        // Determine block type
        if ('include' in obj) {
          blockType = 'include';
          isValid = true; // Include blocks are always valid if they parse
        } else if ('variables' in obj) {
          blockType = 'variables';
          isValid = true; // Variables blocks are always valid if they parse
        } else if (hasTestKey) {
          blockType = 'test';
          // Valid if has test key and at least one HTTP method
          const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
          isValid = httpMethods.some(method => method in obj);
        }

      }
    } catch (error) {
      // Invalid YAML - isValid remains false
    }

    return {
      startLine,
      endLine,
      content,
      testName,
      isValid,
      hasTestKey,
      blockType
    };
  }

  /**
   * Counts the number of test blocks in the document
   */
  countTestsInFile(document: vscode.TextDocument): number {
    const lines = document.getText().split('\n');
    let testCount = 0;
    let inYamlBlock = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('```yaml')) {
        inYamlBlock = true;
      } else if (trimmedLine === '```' && inYamlBlock) {
        inYamlBlock = false;
      } else if (inYamlBlock && trimmedLine.startsWith('test:')) {
        testCount++;
      }
    }

    return testCount;
  }

  /**
   * Finds all YAML blocks in the document
   */
  findAllYamlBlocks(document: vscode.TextDocument): YamlBlock[] {
    const lines = document.getText().split('\n');
    const blocks: YamlBlock[] = [];

    let blockStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('```yaml')) {
        blockStart = i;
      } else if (line === '```' && blockStart >= 0) {
        const content = lines.slice(blockStart + 1, i).join('\n');
        const block = this.parseYamlContent(content, blockStart, i);

        // Include all valid blocks (test, variables, and include blocks)
        if (block.isValid) {
          blocks.push(block);
        }

        blockStart = -1;
      }
    }

    return blocks;
  }
}
