import { YamlBlock, ValidationResult, ErrorType } from '../types';

export class TestDependencyResolver {
  private blocks: Map<string, YamlBlock> = new Map();
  private allBlocks: YamlBlock[] = [];

  constructor(blocks: YamlBlock[]) {
    this.allBlocks = blocks;

    // Build test name -> block map for quick lookup
    for (const block of blocks) {
      if (block.blockType === 'test' && block.testName) {
        this.blocks.set(block.testName, block);
      }
    }
  }

  /**
   * Resolves the execution order for a given test, including:
   * 1. All variables/include blocks that appear before the test in file order
   * 2. All required dependencies (recursively)
   * 3. The target test itself
   */
  resolveExecutionOrder(targetTestName: string): { blocks: YamlBlock[], error?: string } {
    const targetBlock = this.blocks.get(targetTestName);
    if (!targetBlock) {
      return {
        blocks: [],
        error: `Test '${targetTestName}' not found in file`
      };
    }

    // Check for circular dependencies
    const circularCheck = this.detectCircularDependencies(targetTestName, new Set(), []);
    if (circularCheck.hasCircular) {
      return {
        blocks: [],
        error: `Circular dependency detected: ${circularCheck.cycle?.join(' → ')}`
      };
    }

    const executionOrder: YamlBlock[] = [];
    const included = new Set<string>();

    // Step 1: Include all variables/include blocks that appear before the target test
    const targetBlockIndex = this.allBlocks.indexOf(targetBlock);
    for (let i = 0; i < targetBlockIndex; i++) {
      const block = this.allBlocks[i];
      if (block.blockType === 'variables' || block.blockType === 'include') {
        executionOrder.push(block);
      }
    }

    // Step 2: Recursively resolve dependencies
    const dependencyOrder = this.resolveDependencies(targetTestName, included);
    if (dependencyOrder.error) {
      return { blocks: [], error: dependencyOrder.error };
    }

    // Step 3: Add resolved dependencies to execution order
    executionOrder.push(...dependencyOrder.blocks);

    // Step 4: Add the target test itself
    executionOrder.push(targetBlock);

    return { blocks: executionOrder };
  }

  /**
   * Validates all dependencies in the file
   */
  validateAllDependencies(): ValidationResult {
    // Check for missing dependencies
    for (const [testName, block] of this.blocks.entries()) {
      if (block.requires) {
        for (const requiredTest of block.requires) {
          if (!this.blocks.has(requiredTest)) {
            return {
              isValid: false,
              errorType: ErrorType.MISSING_DEPENDENCY,
              message: `Test '${testName}' requires '${requiredTest}' which does not exist`
            };
          }
        }
      }
    }

    // Check for circular dependencies
    for (const testName of this.blocks.keys()) {
      const circularCheck = this.detectCircularDependencies(testName, new Set(), []);
      if (circularCheck.hasCircular) {
        return {
          isValid: false,
          errorType: ErrorType.CIRCULAR_DEPENDENCY,
          message: `Circular dependency detected involving '${testName}': ${circularCheck.cycle?.join(' → ')}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Recursively resolves dependencies for a test
   */
  private resolveDependencies(testName: string, included: Set<string>): { blocks: YamlBlock[], error?: string } {
    if (included.has(testName)) {
      return { blocks: [] }; // Already included
    }

    const block = this.blocks.get(testName);
    if (!block) {
      return {
        blocks: [],
        error: `Required test '${testName}' not found`
      };
    }

    const resolvedBlocks: YamlBlock[] = [];

    // First resolve dependencies of this test
    if (block.requires) {
      for (const requiredTest of block.requires) {
        const depResult = this.resolveDependencies(requiredTest, included);
        if (depResult.error) {
          return depResult;
        }
        resolvedBlocks.push(...depResult.blocks);
      }
    }

    // Then add this test if it's not the target (target gets added separately)
    if (!included.has(testName)) {
      resolvedBlocks.push(block);
      included.add(testName);
    }

    return { blocks: resolvedBlocks };
  }

  /**
   * Detects circular dependencies using DFS
   */
  private detectCircularDependencies(
    testName: string,
    visiting: Set<string>,
    path: string[]
  ): { hasCircular: boolean, cycle?: string[] } {
    if (visiting.has(testName)) {
      // Found a cycle - return the cycle path
      const cycleStart = path.indexOf(testName);
      const cycle = [...path.slice(cycleStart), testName];
      return { hasCircular: true, cycle };
    }

    const block = this.blocks.get(testName);
    if (!block || !block.requires) {
      return { hasCircular: false };
    }

    visiting.add(testName);
    const newPath = [...path, testName];

    for (const requiredTest of block.requires) {
      const result = this.detectCircularDependencies(requiredTest, visiting, newPath);
      if (result.hasCircular) {
        return result;
      }
    }

    visiting.delete(testName);
    return { hasCircular: false };
  }
}
