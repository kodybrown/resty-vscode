import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { spawn } from 'child_process';
import { ExecutionResult, RestyConfig, ErrorType } from '../types';

export class RestyExecutor {
  private config: RestyConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Executes Resty with the given file path
   */
  async executeResty(filePath: string, outputFormat?: string): Promise<ExecutionResult> {
    const executablePath = this.resolveExecutablePath();
    const args = this.buildArguments(filePath, outputFormat);

    return new Promise((resolve, reject) => {
      const childProcess = spawn(executablePath, args, {
        cwd: path.dirname(filePath),
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data: any) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data: any) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code: number | null) => {
        const exitCode = code ?? 0;
        resolve({ stdout, stderr, exitCode });
      });

      childProcess.on('error', (error: any) => {
        if (error.code === 'ENOENT') {
          reject(new Error(`${ErrorType.BINARY_NOT_FOUND}: Resty executable not found at '${executablePath}'. Please check your settings.`));
        } else {
          reject(new Error(`${ErrorType.EXECUTION_FAILED}: ${error.message}`));
        }
      });
    });
  }

  /**
   * Resolves the full path to the Resty executable
   */
  private resolveExecutablePath(): string {
    const configPath = this.config.executablePath;

    if (path.isAbsolute(configPath)) {
      return configPath;
    }

    // Try common locations
    const commonPaths = [
      configPath, // As-is (assumes PATH)
      path.join(os.homedir(), 'bin', configPath),
      path.join(os.homedir(), 'Bin', configPath), // Windows
      path.join(os.homedir(), '.local', 'bin', configPath), // Linux user installs
    ];

    // On Windows, add .exe if not present
    if (os.platform() === 'win32' && !configPath.endsWith('.exe')) {
      commonPaths.push(
        configPath + '.exe',
        path.join(os.homedir(), 'bin', configPath + '.exe'),
        path.join(os.homedir(), 'Bin', configPath + '.exe')
      );
    }

    for (const testPath of commonPaths) {
      try {
        fs.accessSync(testPath, fs.constants.F_OK);
        return testPath;
      } catch {
        // Continue to next path
      }
    }

    // Fallback to original path (might be in PATH)
    return configPath;
  }

  /**
   * Builds command line arguments for Resty
   */
  private buildArguments(filePath: string, outputFormat?: string): string[] {
    const args = [filePath];

    // Add output format if specified and not default
    const format = outputFormat || this.config.defaultOutputFormat;
    if (format && format !== 'markdown') {
      args.push('-o', format);
    }

    return args;
  }

  /**
   * Loads configuration from VSCode settings
   */
  private loadConfig(): RestyConfig {
    const config = vscode.workspace.getConfiguration('resty');

    return {
      executablePath: config.get<string>('executablePath', 'resty'),
      defaultOutputFormat: config.get<'markdown' | 'json' | 'xml' | 'html'>('defaultOutputFormat', 'markdown'),
      showOutputOnRun: config.get<boolean>('showOutputOnRun', true),
      autoCloseOldResults: config.get<boolean>('autoCloseOldResults', false),
      tempFileCleanup: config.get<boolean>('tempFileCleanup', true)
    };
  }

  /**
   * Refreshes configuration from VSCode settings
   */
  refreshConfig(): void {
    this.config = this.loadConfig();
  }

  /**
   * Gets current configuration
   */
  getConfig(): RestyConfig {
    return { ...this.config };
  }
}
