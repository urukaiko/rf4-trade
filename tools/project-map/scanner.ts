import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { ProjectMapConfig, ScanResult } from './types';

/**
 * Scanner stage.
 * 
 * Responsibility: Walk the filesystem and collect file paths.
 * Knows NOTHING about TypeScript, AST, or exports.
 * Only knows about files, folders, and filters.
 * 
 * @param config - Configuration with exclusion rules
 * @returns Array of absolute file paths matching criteria
 */
export function scan(config: ProjectMapConfig): ScanResult {
  const results: string[] = [];
  
  walkDirectory(config.rootDir, config, results);
  
  return results;
}

/**
 * Recursively walk directory tree.
 */
function walkDirectory(
  dir: string,
  config: ProjectMapConfig,
  accumulator: string[]
): void {
  let entries: string[];
  
  try {
    entries = readdirSync(dir);
  } catch {
    // Cannot read directory - skip silently
    return;
  }
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    
    // Skip excluded directories at any level
    if (config.excludeDirs.has(entry)) {
      continue;
    }
    
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      // Cannot stat - skip
      continue;
    }
    
    if (stat.isDirectory()) {
      // Recurse into subdirectory
      walkDirectory(fullPath, config, accumulator);
    } else if (stat.isFile()) {
      // Check extension and exclusions
      const ext = extname(entry);
      
      if (config.extensions.has(ext) && !config.excludeFiles.has(entry)) {
        accumulator.push(fullPath);
      }
    }
  }
}