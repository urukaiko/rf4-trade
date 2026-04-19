import { writeFileSync } from 'node:fs';
import { config } from './config';
import { scan } from './scanner';
import { parse } from './parser';
import { normalize } from './normalizer';
import { render } from './renderer';
import type { RenderResult } from './types';

/**
 * Main entry point.
 * 
 * Assembles the pipeline:
 *   scan → parse → normalize → render → write
 * 
 * Each stage is independent and can be tested separately.
 */
async function main(): Promise<void> {
  console.log('🗺️  Project Map Generator');
  console.log('━'.repeat(40));
  
  // Stage 1: Scan filesystem
  console.log('\n📂 Scanning...');
  const filePaths = scan(config);
  console.log(`   Found ${filePaths.length} source files`);
  
  // Stage 2: Parse AST
  console.log('🔍 Parsing exports...');
  const parsedFiles = parse(filePaths, config);
  
  // Stage 3: Normalize data
  console.log('✨ Normalizing...');
  const normalizedData = normalize(parsedFiles, config);
  console.log(`   ${normalizedData.totalFiles} files, ${normalizedData.totalExports} exports`);
  
  // Stage 4: Render output
  console.log('📝 Rendering...');
  const outputLines: RenderResult = render(normalizedData, config);
  const outputText = outputLines.join('\n');
  
  // Stage 5: Write file
  writeFileSync(config.outputFile, outputText, 'utf-8');
  
  const sizeKB = (outputText.length / 1024).toFixed(1);
  console.log(`\n✅ Done!`);
  console.log(`   📄 ${outputLines.length} lines`);
  console.log(`   💾 ${sizeKB} KB`);
  console.log(`   📁 ${config.outputFile}`);
}

// Run
main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});