import type { FormResearch } from '../engine';
import { orderOptions, randomSeed } from './option-order';

export type { FormResearch };

export const research: FormResearch = { seed: randomSeed, order: orderOptions };
