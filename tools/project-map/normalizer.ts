import type {
  ProjectMapConfig,
  ParseResult,
  NormalizeResult,
  RawFileInfo,
  RawExportInfo,
  NormalizedFileInfo,
  NormalizedExportInfo,
  DirectoryGroup,
} from './types';

export function normalize(
  parsedFiles: ParseResult,
  config: ProjectMapConfig
): NormalizeResult {
  const normalizedFiles = parsedFiles.map(file => normalizeFile(file, config));
  const groups = groupByDirectory(normalizedFiles);
  const totalExports = normalizedFiles.reduce((sum, f) => sum + f.exports.length, 0);
  
  return { groups, totalFiles: normalizedFiles.length, totalExports };
}

function normalizeFile(file: RawFileInfo, config: ProjectMapConfig): NormalizedFileInfo {
  const isConfigFile = config.configFileNames.has(file.fileName);
  const isBarrel = detectBarrelFile(file);
  const isConstants = detectConstantsFile(file.exports);

  let normalizedExports = file.exports.map(exp => normalizeExport(exp, config));

  if (isConstants && normalizedExports.length > config.constantsCollapseThreshold) {
    normalizedExports = collapseConstants(normalizedExports);
  }

  return {
    path: file.path,
    fileName: file.fileName,
    dirPath: file.dirPath,
    exports: normalizedExports,
    isConfigFile,
    isBarrelFile: isBarrel,
    isEmptySvelte: file.fileName.endsWith('.svelte') && normalizedExports.length === 0,
    isConstantsFile: isConstants,
  };
}

function normalizeExport(exp: RawExportInfo, config: ProjectMapConfig): NormalizedExportInfo {
  const result: NormalizedExportInfo = { name: exp.name, kind: exp.kind };

  if (exp.rawSignature) {
    result.signature = cleanSignature(exp.name, exp.rawSignature, config);
  }

  if (exp.rawMembers && exp.rawMembers.length > 0) {
    result.members = truncateMembers(exp.rawMembers, config.maxMembersDisplay);
  }

  if (exp.reExportSource) {
    result.reExportSource = exp.reExportSource;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════

function cleanSignature(name: string, rawSig: string, config: ProjectMapConfig): string {
  if (!rawSig || !rawSig.trim()) return '';

  let sig = rawSig;

  sig = sig.replace(/^export\s+/, '');
  sig = sig.replace(/^(async\s+)?function\s+/, '$1');
  sig = sig.replace(/^(const|let|var)\s+/, '');
  sig = sig.replace(/[;,\s]+$/, '').trim();
  sig = removeNameDuplication(name, sig);
  sig = shortenAbsoluteImports(sig);

  if (sig.length > config.maxSignatureLength) {
    sig = sig.slice(0, config.maxSignatureLength) + '…';
  }

  sig = sig.replace(/\s+/g, ' ').trim();
  return sig;
}

function removeNameDuplication(name: string, sig: string): string {
  if (!name || !sig) return sig;

  const n = name.trim();
  const s = sig.trim();

  if (!s.toLowerCase().startsWith(n.toLowerCase())) return s;

  const patternA = new RegExp(`^${escapeRe(n)}:\\s*${escapeRe(n)}[:\\s(]`, '');
  if (patternA.test(s)) {
    return s.replace(new RegExp(`^${escapeRe(n)}:\\s*${escapeRe(n)}[:\\s]*`), '').trim();
  }

  const afterColon = s.replace(new RegExp(`^${escapeRe(n)}:\\s*`), '');
  if (afterColon !== s) {
    return afterColon.trim();
  }

  if (s === `${n}: ${n}`) return '';

  return s;
}

function shortenAbsoluteImports(sig: string): string {
  return sig.replace(
    /import\(["'][^"']*[\\/](src|lib)[\\/](.*)["']\)\.?/gi,
    (_m, _srcOrLib, pathPart: string) => {
      const clean = pathPart.replace(/\\/g, '/');
      const parts = clean.split('/');
      return parts.length <= 2 ? parts.join('/') + '.' : parts.slice(-2).join('/') + '.';
    }
  );
}

function truncateMembers(members: string[], maxDisplay: number): string[] {
  if (members.length <= maxDisplay) return members;
  return [...members.slice(0, maxDisplay), `+${members.length - maxDisplay} more`];
}

function collapseConstants(exports: NormalizedExportInfo[]): NormalizedExportInfo[] {
  const sampleNames = exports.slice(0, 3).map(e => e.name);
  const remaining = exports.length - 3;
  return [{ name: `[${sampleNames.join(', ')}${remaining > 0 ? ` +${remaining}` : ''}]`, kind: 'const' }];
}

// ═══════════════════════════════════════════════════════════════

function detectBarrelFile(file: RawFileInfo): boolean {
  if (!/^(index|exports)\.(ts|tsx|js|jsx)$/.test(file.fileName)) {
    return false;
  }

  const total = file.exports.length;
  if (total < 3) return false;

  const reExportCount = file.exports.filter(e => e.kind === 're-export').length;
  const ratio = reExportCount / total;

  if (ratio >= 0.9) return true;
  if (ratio > 0.5 && total >= 8) return true;
  
  return false;
}

function detectConstantsFile(exports: RawExportInfo[]): boolean {
  if (exports.length < 5) return false;

  const allVariables = exports.every(e =>
    e.kind === 'const' || e.kind === 'let' || e.kind === 'var'
  );
  if (!allVariables) return false;

  const upperCaseCount = exports.filter(e => /^[A-Z_]{2,}$/.test(e.name)).length;
  return (upperCaseCount / exports.length) > 0.7;
}

function groupByDirectory(files: NormalizedFileInfo[]): DirectoryGroup[] {
  const map = new Map<string, NormalizedFileInfo[]>();

  for (const file of files) {
    const existing = map.get(file.dirPath) ?? [];
    existing.push(file);
    map.set(file.dirPath, existing);
  }

  return Array.from(map.entries())
    .map(([dirPath, files]) => ({
      dirPath,
      files: files.sort((a, b) => a.fileName.localeCompare(b.fileName)),
    }))
    .sort((a, b) => a.dirPath.localeCompare(b.dirPath));
}

function escapeRe(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}