import * as zod from 'zod';
import { modules } from './registry';

modules().zod = zod;
