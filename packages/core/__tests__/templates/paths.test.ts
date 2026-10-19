import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateSubmission } from '../../src/server';

const definition = (slug: string) => JSON.parse(readFileSync(resolve(__dirname, `../../../../templates/${slug}.json`), 'utf8')).definition;
const errorsOf = (slug: string, values: Record<string, unknown>) => validateSubmission(definition(slug), values).errors;

describe('moving-quote-request', () => {
  const base = {
    fromZip: '10001',
    size: '2br',
    fromFloor: '3',
    fromElevator: 'yes',
    fromParking: 'yes',
    survey: 'video',
    name: 'Sam',
    contactBy: 'email',
    email: 'sam@example.com',
  };

  it('skips the new place when the destination is unknown', () => {
    expect(errorsOf('moving-quote-request', base)).toEqual({});
  });

  it('asks about the new place once a destination ZIP is given', () => {
    expect(Object.keys(errorsOf('moving-quote-request', { ...base, toZip: '94105' }))).toEqual(['toFloor', 'toParking']);
  });

  it('accepts a known destination with its access answers', () => {
    expect(errorsOf('moving-quote-request', { ...base, toZip: '94105', toFloor: 'ground', toParking: 'no' })).toEqual({});
  });

  it('requires only the chosen contact channel', () => {
    expect(Object.keys(errorsOf('moving-quote-request', { ...base, contactBy: 'call', email: undefined }))).toEqual(['phone']);
  });
});

describe('custom-cake-order', () => {
  const base = {
    date: '2030-05-01',
    fulfillment: 'pickup',
    pickupTime: '10:00',
    servings: '10',
    style: 'drip',
    shape: 'round',
    flavor: 'lemon',
    name: 'Sam',
    email: 'sam@example.com',
    phone: '5551234567',
  };

  it.each(['no', 'unsure'])('needs no allergen list for %s', (hasAllergies) => {
    expect(errorsOf('custom-cake-order', { ...base, hasAllergies })).toEqual({});
  });

  it('requires an answer to the allergy question', () => {
    expect(Object.keys(errorsOf('custom-cake-order', base))).toEqual(['hasAllergies']);
  });

  it('requires the allergens after Yes', () => {
    expect(Object.keys(errorsOf('custom-cake-order', { ...base, hasAllergies: 'yes' }))).toEqual(['allergies']);
  });

  it('requires a description after Other', () => {
    expect(Object.keys(errorsOf('custom-cake-order', { ...base, hasAllergies: 'yes', allergies: ['milk', 'other'] }))).toEqual([
      'allergyOther',
    ]);
    expect(errorsOf('custom-cake-order', { ...base, hasAllergies: 'yes', allergies: ['milk', 'other'], allergyOther: 'Kiwi' })).toEqual({});
  });
});
