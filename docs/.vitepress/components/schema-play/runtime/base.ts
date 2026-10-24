import { schemaValidate } from '@formhaus/core/schema';
import { demoFetch, errorsOf, load, problemOf, type Request, type Validate } from './module';
import { modules } from './registry';

Object.assign(modules(), { '@formhaus/core/schema': { schemaValidate }, '@formhaus/core': {} });
globalThis.fetch = demoFetch;
let validate: Validate | undefined;

const reply = (message: object) => parent.postMessage(message, '*');

addEventListener('message', async (event: MessageEvent<Request>) => {
  if (event.source !== parent) return;
  const request = event.data;
  if (request.type === 'run') {
    try {
      validate = load(request.code, modules());
      reply({ type: 'loaded' });
    } catch (error) {
      reply({ type: 'loaded', problem: problemOf(error) });
    }
  } else if (validate) {
    try {
      reply({ type: 'result', id: request.id, errors: errorsOf(await validate(request.values, request.context)) });
    } catch (error) {
      reply({ type: 'result', id: request.id, problem: problemOf(error) });
    }
  }
});
