import type { FormEngine } from '../engine';
import { changeStep } from '../engine/navigation';
import type { EngineInternals } from '../engine/runtime-internals';

export function autoAdvance(engine: FormEngine): Promise<boolean> {
  return changeStep(engine as unknown as EngineInternals, 'next', 'autoAdvance');
}
