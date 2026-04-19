/**
 * Core types for the project map pipeline.
 * 
 * These types flow through all stages:
 * ScanResult → ParseResult → NormalizedResult → RenderResult
 */

// ── Export Types ──────────────────────────────────────────────

/** Kinds of exports we can detect */
export type ExportKind =
  | 'function'
  | 'async-function'
  | 'const'
  | 'let'
  | 'var'
  | 'interface'
  | 'type'
  | 'class'
  | 'enum'
  | 're-export';

/** Single export from a file */
export interface RawExportInfo {
  /** Export name as declared in source */
  name: string;
  /** What kind of export this is */
  kind: ExportKind;
  /** Full signature text from AST (before normalization) */
  rawSignature?: string;
  /** Members for interfaces/classes/enums (before normalization) */
  rawMembers?: string[];
  /** For re-exports: where this comes from */
  reExportSource?: string;
}

/** Same as RawExportInfo but after normalization */
export interface NormalizedExportInfo {
  name: string;
  kind: ExportKind;
  /** Cleaned signature (duplicates removed, keywords stripped) */
  signature?: string;
  /** Cleaned and potentially truncated members list */
  members?: string[];
  /** Where re-export comes from (cleaned path) */
  reExportSource?: string;
}

// ── File Types ────────────────────────────────────────────────

/** File info after parsing (raw) */
export interface RawFileInfo {
  /** Relative path from project root */
  path: string;
  /** Just filename with extension */
  fileName: string;
  /** Directory path (relative) */
  dirPath: string;
  /** All exports found in this file */
  exports: RawExportInfo[];
}

/** File info after normalization */
export interface NormalizedFileInfo {
  path: string;
  fileName: string;
  dirPath: string;
  exports: NormalizedExportInfo[];
  
  // Metadata flags for renderer decisions
  isConfigFile: boolean;
  isBarrelFile: boolean;
  isEmptySvelte: boolean;
  isConstantsFile: boolean;
}

// ── Directory Grouping ────────────────────────────────────────

/** Files grouped under same directory */
export interface DirectoryGroup {
  /** Directory path (relative to root) */
  dirPath: string;
  /** Files in this directory (sorted) */
  files: NormalizedFileInfo[];
}

// ── Pipeline Stage Results ────────────────────────────────────

/** Output of scanner stage */
export type ScanResult = string[];

/** Output of parser stage */
export type ParseResult = RawFileInfo[];

/** Output of normalizer stage */
export type NormalizeResult = {
  groups: DirectoryGroup[];
  totalFiles: number;
  totalExports: number;
};

/** Output of renderer stage */
export type RenderResult = string[];

// ── Config Type ───────────────────────────────────────────────

export interface ProjectMapConfig {
  rootDir: string;
  outputFile: string;
  
  excludeDirs: ReadonlySet<string>;
  excludeFiles: ReadonlySet<string>;
  extensions: ReadonlySet<string>;
  configFileNames: ReadonlySet<string>;
  
  maxSignatureLength: number;
  maxMembersDisplay: number;
  constantsCollapseThreshold: number;
  svelteGroupThreshold: number;
}