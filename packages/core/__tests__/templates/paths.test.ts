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

describe('rental-application', () => {
  const base = {
    property: '12 Oak St',
    moveIn: '2030-05-01',
    firstName: 'Sam',
    lastName: 'Lee',
    email: 'sam@example.com',
    phone: '5551234567',
    street: '1 Main St',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    housing: 'own',
    howLong: '2y-plus',
    employment: 'retired',
    monthlyIncome: 3000,
    occupants: '1',
    pets: 'no',
    accurate: true,
  };
  const adults = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ adultName: `Adult ${index}`, adultEmail: `adult${index}@example.com` }));

  it('accepts the largest household', () => {
    expect(errorsOf('rental-application', { ...base, occupants: '12', coApplicants: adults(11) })).toEqual({});
  });

  it('rejects more other adults than the household can hold', () => {
    expect(Object.keys(errorsOf('rental-application', { ...base, occupants: '12', coApplicants: adults(12) }))).toEqual(['coApplicants']);
  });

  it.each(['1.5', '0', '13'])('rejects %s occupants', (occupants) => {
    expect(Object.keys(errorsOf('rental-application', { ...base, occupants }))).toEqual(['occupants']);
  });
});
