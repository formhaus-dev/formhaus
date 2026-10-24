import { describe, expect, it } from 'vitest';
import { errorSummary, FormEngine, type FormDefinition } from '../../src';

const trip: FormDefinition = {
  id: 'trip',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'who',
      title: 'Who',
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
        { key: 'guests', type: 'group', label: 'Guests', defaultItems: 2, fields: [{ key: 'guest', type: 'text', label: 'Guest' }] },
      ],
    },
    { id: 'where', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

describe('errorSummary', () => {
  it('is empty for a form without errors', () => {
    expect(errorSummary(new FormEngine(trip))).toEqual({ groups: [], topLevelErrors: [], count: 0 });
  });

  it('groups field errors by step with item paths, DOM ids and counts', () => {
    const engine = new FormEngine(trip);
    engine.setErrors({ name: 'Taken', 'guests.1.guest': 'Too short', city: 'Unknown', coupon: 'Server down' });
    expect(errorSummary(engine, { idPrefix: 'trip' })).toEqual({
      groups: [
        {
          id: 'who',
          title: 'Who',
          entries: [
            { key: 'name', id: 'trip-name', text: 'Name: Taken', message: 'Taken' },
            { key: 'guests.1.guest', id: 'trip-guests--1--guest', text: 'Guest (Guests 2): Too short', message: 'Too short' },
          ],
        },
        { id: 'where', title: 'Step 2', entries: [{ key: 'city', id: 'trip-city', text: 'City: Unknown', message: 'Unknown' }] },
      ],
      topLevelErrors: ['Server down'],
      count: 3,
    });
  });

  it('uses the default id prefix', () => {
    const engine = new FormEngine(trip);
    engine.setErrors({ name: 'Taken' });
    expect(errorSummary(engine).groups[0].entries[0].id).toBe('fh-name');
  });

  it('reads labels from the options before the definition', () => {
    const engine = new FormEngine({ ...trip, labels: { stepTitle: 'Part {index}', itemLabel: 'Guest {index}' } });
    engine.setErrors({ 'guests.0.guest': 'Missing', city: 'Unknown' });
    const { groups } = errorSummary(engine, { labels: { itemLabel: 'Person {index}' } });
    expect(groups.map(({ title, entries }) => [title, entries.map((entry) => entry.text)])).toEqual([
      ['Who', ['Guest (Person 1): Missing']],
      ['Part 2', ['City: Unknown']],
    ]);
  });
});
