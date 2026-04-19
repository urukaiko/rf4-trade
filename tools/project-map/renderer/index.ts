import type { NormalizeResult, ProjectMapConfig, RenderResult } from '../types';
import { renderCompact } from './compact';

/**
 * Renderer selector.
 * 
 * Currently only one renderer (compact).
 * When adding more modes (--detailed, --minimal),
 * add them here and select based on config.
 */
export function render(
  data: NormalizeResult,
  config: ProjectMapConfig
): RenderResult {
  // For now, always use compact
  // Future: switch on config.mode or CLI flag
  return renderCompact(data, config);
}