import type {
  NormalizeResult,
  NormalizedFileInfo,
  NormalizedExportInfo,
  DirectoryGroup,
  ProjectMapConfig,
  RenderResult,
} from '../types';

export function renderCompact(
  data: NormalizeResult,
  config: ProjectMapConfig
): RenderResult {
  const lines: string[] = [];
  
  for (const group of data.groups) {
    renderGroup(group, lines, config);
    lines.push('');
  }
  
  return lines;
}

function renderGroup(
  group: DirectoryGroup,
  lines: string[],
  config: ProjectMapConfig
): void {
  lines.push(`${group.dirPath}/`);
  
  const svelteFiles = group.files.filter(f => f.fileName.endsWith('.svelte'));
  const otherFiles = group.files.filter(f => !f.fileName.endsWith('.svelte'));
  
  if (svelteFiles.length >= config.svelteGroupThreshold) {
    lines.push(`  [${svelteFiles.length} Svelte components]`);
    
    for (const sf of svelteFiles) {
      if (sf.exports.length > 0) {
        lines.push(`    ${sf.fileName}`);
        for (const exp of sf.exports) {
          lines.push(`      ${formatExport(exp, config)}`);
        }
      }
    }
  } else {
    for (const file of svelteFiles) {
      renderFile(file, lines, config);
    }
  }
  
  for (const file of otherFiles) {
    renderFile(file, lines, config);
  }
}

function renderFile(
  file: NormalizedFileInfo,
  lines: string[],
  config: ProjectMapConfig
): void {
  if (file.isConfigFile) {
    lines.push(`  ⚙️ ${file.fileName}`);
    return;
  }
  
  if (file.isBarrelFile) {
    const sources = [...new Set(file.exports.map(e => e.reExportSource?.replace(/^\.\//, '') || ''))];
    const display = sources.length > 6 ? `${sources.length} modules` : sources.join(', ');
    lines.push(`  📦 ${file.fileName} → [${file.exports.length}] (${display})`);
    return;
  }
  
  if (file.isEmptySvelte) {
    lines.push(`  🎨 ${file.fileName}`);
    return;
  }
  
  if (file.exports.length === 0) {
    lines.push(`  ${file.fileName}`);
    return;
  }
  
  lines.push(`  ${file.fileName}`);
  
  for (const exp of file.exports) {
    lines.push(`    ${formatExport(exp, config)}`);
  }
}

function formatExport(exp: NormalizedExportInfo, config: ProjectMapConfig): string {
  let line = exp.name;
  
  if (exp.kind === 're-export' && exp.reExportSource) {
    let source = exp.reExportSource
      .replace(/^\.\//, '')
      .replace(/^\.\.\//, '');
    line += ` → ${source}`;
    return line;
  }
  
  if (exp.signature && exp.signature.length > 0) {
    line += `: ${exp.signature}`;
  }
  
  if (exp.members && exp.members.length > 0) {
    line += ` { ${exp.members.join(', ')} }`;
  }
  
  return line;
}