import { Project, SyntaxKind, type SourceFile } from 'ts-morph';
import { relative, dirname, basename } from 'node:path';
import { readFileSync } from 'node:fs';
import type {
  ProjectMapConfig,
  ScanResult,
  ParseResult,
  RawFileInfo,
  RawExportInfo,
  ExportKind,
} from './types';

export function parse(
  filePaths: ScanResult,
  config: ProjectMapConfig
): ParseResult {
  const project = new Project({
    tsConfigFilePath: joinPaths(config.rootDir, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });
  
  return filePaths.map(path => parseSingleFile(path, project, config));
}

function parseSingleFile(
  absolutePath: string,
  project: Project,
  config: ProjectMapConfig
): RawFileInfo {
  const relPath = relative(config.rootDir, absolutePath);
  const fileName = basename(relPath);
  const dirPath = dirname(relPath);
  const ext = fileName.slice(fileName.lastIndexOf('.'));

  if (config.configFileNames.has(fileName)) {
    return { path: relPath, fileName, dirPath, exports: [] };
  }

  if (ext === '.svelte') {
    const hasExports = checkSvelteHasExports(absolutePath);
    return { path: relPath, fileName, dirPath, exports: hasExports ? [] : [] };
  }

  let sourceFile: SourceFile;
  try {
    sourceFile = project.addSourceFileAtPath(absolutePath);
  } catch {
    return { path: relPath, fileName, dirPath, exports: [] };
  }

  // ══════════════════════════════════════════════════
  // CRITICAL: Process EXPORT DECLARATIONS first!
  // This catches: export { X } from 'mod'
  //             export { default as X } from 'mod'
  // ══════════════════════════════════════════════════
  
  const exports: RawExportInfo[] = [];
  const seenNames = new Set<string>();

  // STEP 1: Re-exports from export declarations
  for (const expDecl of sourceFile.getExportDeclarations()) {
    if (expDecl.isNamespaceExport()) continue;
    
    const moduleSpecifier = expDecl.getModuleSpecifierValue();
    const namedExports = expDecl.getNamedExports();
    
    for (const namedExp of namedExports) {
      const aliasNode = namedExp.getAliasNode();
      const alias = aliasNode?.getText()?.replace(/^['"]|['"]$/g, '') || '';
      const originalName = namedExp.getName();
      const exportName = alias || originalName;
      
      if (!seenNames.has(exportName)) {
        seenNames.add(exportName);
        
        exports.push({
          name: exportName,
          kind: 're-export',
          reExportSource: moduleSpecifier,
        });
      }
    }
  }

  // STEP 2: Actual declarations (functions, consts, interfaces, etc.)
  for (const symbol of sourceFile.getExportSymbols()) {
    const name = symbol.getName();
    
    if (seenNames.has(name)) continue; // Skip if already found as re-export
    
    seenNames.add(name);

    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) continue;

    const decl = declarations[0];
    const kind = decl.getKind();

    const info = extractDeclarationInfo(decl, kind, name);
    if (info) {
      exports.push(info);
    }
  }

  return { path: relPath, fileName, dirPath, exports };
}

function extractDeclarationInfo(
  decl: any,
  kind: number,
  name: string
): RawExportInfo | null {
  switch (kind) {
    case SyntaxKind.FunctionDeclaration:
    case SyntaxKind.FunctionExpression: {
      const sig = decl.getText().split('{')[0];
      return { name, kind: 'function', rawSignature: sig };
    }

    case SyntaxKind.VariableDeclaration: {
      const sig = decl.getText().split('=')[0];
      return { name, kind: 'const', rawSignature: sig };
    }

    case SyntaxKind.InterfaceDeclaration: {
      const members = decl.getProperties().map((p: any) => {
        const propName = p.getName();
        let propType: string;
        try {
          const typeText = p.getType().getText();
          if (typeText.includes('import(') || /^[A-Z]:\\/.test(typeText)) {
            const match = typeText.match(/\.([A-Z][A-Za-z0-9]*)["']?\)?$/);
            propType = match ? match[1] : propName;
          } else {
            propType = typeText;
          }
        } catch {
          propType = propName;
        }
        return `${propName}: ${propType}`;
      });
      return { name, kind: 'interface', rawMembers: members };
    }

    case SyntaxKind.TypeAliasDeclaration: {
      let sig = '';
      try {
        sig = (decl as any).getTypeNode()?.getText() ?? '';
        if (sig.includes('import(')) {
          const match = sig.match(/import\([^)]*\)\.([A-Z][A-Za-z0-9]*)/);
          sig = match ? match[1] : sig;
        }
      } catch { sig = '...'; }
      return { name, kind: 'type', rawSignature: sig };
    }

    case SyntaxKind.ClassDeclaration: {
      const members = decl.getMethods().map((m: any) => {
        return `${m.getName()}(${m.getParameters().map((p: any) => p.getName()).join(',')})`;
      });
      return { name, kind: 'class', rawMembers: members };
    }

    case SyntaxKind.EnumDeclaration: {
      const members = decl.getMembers().map((m: any) => m.getName());
      return { name, kind: 'enum', rawMembers: members };
    }

    default: {
      const text = decl.getText()?.split('\n')[0]?.slice(0, 150);
      if (text) return { name, kind: 'const', rawSignature: text };
      return null;
    }
  }
}

function checkSvelteHasExports(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const match = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    return match ? /export\s+(function|class|const|let|var|type|interface|enum)/.test(match[1]) : false;
  } catch {
    return false;
  }
}

function joinPaths(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/');
}