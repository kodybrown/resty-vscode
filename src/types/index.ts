export interface YamlBlock {
  startLine: number;
  endLine: number;
  content: string;
  testName?: string;
  isValid: boolean;
  hasTestKey: boolean;
  blockType: 'test' | 'variables' | 'include';
  requires?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errorType?: string;
  message?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface Variable {
  name: string;
  value: string;
  source: 'file' | 'environment' | 'captured' | 'included';
  type: string;
}

export interface RestyConfig {
  executablePath: string;
  defaultOutputFormat: 'markdown' | 'json' | 'xml' | 'html';
  showOutputOnRun: boolean;
  autoCloseOldResults: boolean;
  tempFileCleanup: boolean;
}

export enum ErrorType {
  NO_YAML_BLOCK = 'NO_YAML_BLOCK',
  NOT_TEST_BLOCK = 'NOT_TEST_BLOCK',
  INVALID_TEST = 'INVALID_TEST',
  INVALID_FILE = 'INVALID_FILE',
  BINARY_NOT_FOUND = 'BINARY_NOT_FOUND',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',
  DEPENDENCY_FAILED = 'DEPENDENCY_FAILED'
}
