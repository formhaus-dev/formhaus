import { describe, expect, it } from 'vitest';
import { checkDefinition, resolveSources, type FormDefinition, type FormField, type SourceContext } from '../../src';
import { validateSubmission } from '../../src/server';

const form = (fields: FormField[]): FormDefinition => ({ id: 'f', title: 'F', submit: { label: 'Send' }, fields });
const hidden = (key: string, source: unknown, extra: Partial<FormField> = {}): FormField => ({
  key,
  type: 'hidden',
  label: key,
  source: source as FormField['source'],
  ...extra,
});
const codes = (definition: FormDefinition) => checkDefinition(definition).map(({ code, severity, path }) => `${severity} ${code} ${path}`);

const visit: SourceContext = {
  search: '?utm_source=news&utm_medium=&ref=%20partner%20',
  href: 'https://shop.example/pricing?coupon=SECRET#plans',
  referrer: 'https://search.example/',
  pageTitle: 'Pricing',
  language: 'de-DE',
  timezone: 'Europe/Berlin',
  device: 'mobile',
};

describe('resolveSources', () => {
  it('reads each source kind and strips the query and hash from the page', () => {
    const definition = form([
      hidden('utm_source', { query: 'utm_source' }),
      hidden('ref', { query: 'ref' }),
      hidden('referrer', 'referrer'),
      hidden('page', 'page'),
      hidden('title', 'pageTitle'),
      hidden('language', 'language'),
      hidden('timezone', 'timezone'),
      hidden('device', 'device'),
    ]);
    expect(resolveSources(definition, visit)).toEqual({
      utm_source: 'news',
      ref: 'partner',
      referrer: 'https://search.example/',
      page: 'https://shop.example/pricing',
      title: 'Pricing',
      language: 'de-DE',
      timezone: 'Europe/Berlin',
      device: 'mobile',
    });
  });

  it('leaves out sources that yield nothing so defaultValue stays', () => {
    const definition = form([
      hidden('utm_medium', { query: 'utm_medium' }, { defaultValue: 'organic' }),
      hidden('utm_term', { query: 'utm_term' }),
      hidden('referrer', 'referrer'),
      hidden('country', 'country'),
    ]);
    expect(resolveSources(definition, { search: '?utm_medium=', referrer: '   ' })).toEqual({});
    expect(resolveSources(definition, {})).toEqual({});
  });

  it('skips keys the app passed and fields that are not hidden', () => {
    const definition = form([
      hidden('utm_source', { query: 'utm_source' }),
      { key: 'name', type: 'text', label: 'Name', source: 'language' },
    ]);
    expect(resolveSources(definition, visit, { utm_source: 'partner' })).toEqual({});
    expect(resolveSources(definition, visit, { utm_source: '' })).toEqual({ utm_source: 'news' });
    expect(resolveSources(definition, visit, { utm_source: null })).toEqual({ utm_source: 'news' });
  });

  it('strips the query and hash from the referrer', () => {
    const definition = form([hidden('referrer', 'referrer')]);
    expect(resolveSources(definition, { referrer: 'https://shop.example/cart?token=SECRET#pay' })).toEqual({
      referrer: 'https://shop.example/cart',
    });
    expect(resolveSources(definition, { referrer: 'not a url' })).toEqual({});
  });

  it('never throws when a context value cannot be read', () => {
    const failing: SourceContext = {
      get language(): string {
        throw new Error('blocked');
      },
      get href(): string {
        return 'not a url';
      },
      timezone: 'UTC',
    };
    const definition = form([hidden('language', 'language'), hidden('page', 'page'), hidden('timezone', 'timezone')]);
    expect(resolveSources(definition, failing)).toEqual({ timezone: 'UTC' });
  });

  it('trims and caps values to maxLength or 2000 characters', () => {
    const long = `?q=${'a'.repeat(3000)}`;
    expect(resolveSources(form([hidden('q', { query: 'q' })]), { search: long }).q).toHaveLength(2000);
    expect(resolveSources(form([hidden('q', { query: 'q' }, { validation: { maxLength: 5 } })]), { search: long }).q).toBe('aaaaa');
  });

  it('resolves steps and keeps the first field of a shared key', () => {
    const definition: FormDefinition = {
      id: 'f',
      title: 'F',
      submit: { label: 'Send' },
      steps: [
        { id: 'a', title: 'A', fields: [hidden('from', 'referrer')] },
        { id: 'b', title: 'B', fields: [hidden('from', 'language')] },
      ],
    };
    expect(resolveSources(definition, visit)).toEqual({ from: 'https://search.example/' });
  });
});

describe('source checks', () => {
  it('accepts every source kind', () => {
    const kinds = ['referrer', 'page', 'pageTitle', 'language', 'timezone', 'device', 'country'];
    expect(codes(form([...kinds.map((kind) => hidden(kind, kind)), hidden('q', { query: 'utm_source' })]))).toEqual([]);
  });

  it('rejects an unknown source and suggests the closest one', () => {
    const issues = checkDefinition(form([hidden('a', 'refferer'), hidden('b', 'query'), hidden('c', 'ip')]));
    expect(issues.map(({ code, path, hint }) => [code, path, hint])).toEqual([
      ['unknown-source', '/fields/0/source', 'Use "referrer".'],
      ['unknown-source', '/fields/1/source', 'Use { "query": "<parameter name>" } for a URL parameter.'],
      ['unknown-source', '/fields/2/source', 'Use one of: "referrer", "page", "pageTitle", "language", "timezone", "device", "country".'],
    ]);
  });

  it('rejects a malformed query source', () => {
    expect(
      codes(form([hidden('a', { query: '' }), hidden('b', { param: 'x' }), hidden('c', { query: 'x', page: true }), hidden('d', 42)])),
    ).toEqual([
      'error invalid-type /fields/0/source',
      'error invalid-type /fields/1/source',
      'error invalid-type /fields/2/source',
      'error invalid-type /fields/3/source',
    ]);
  });

  it('warns about a source on a field that is not hidden', () => {
    expect(codes(form([{ key: 'name', type: 'text', label: 'Name', source: 'language' }]))).toEqual([
      'warning source-not-applicable /fields/0/source',
    ]);
  });
});

describe('hidden values on the server', () => {
  it('accepts a missing hidden value and caps hidden values at 2000 characters unless maxLength says otherwise', () => {
    const definition = form([hidden('utm_source', { query: 'utm_source' }), hidden('country', 'country')]);
    expect(validateSubmission(definition, {})).toEqual({ values: {}, errors: {} });
    expect(validateSubmission(definition, { utm_source: 'a'.repeat(2001) }).errors).toEqual({
      utm_source: 'utm_source: Maximum length is 2000',
    });
    const longer = form([hidden('token', undefined, { validation: { maxLength: 5000 } })]);
    expect(validateSubmission(longer, { token: 'a'.repeat(3000) }).errors).toEqual({});
  });
});
