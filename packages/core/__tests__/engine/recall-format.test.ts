import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormEngine, recallText, type FormDefinition, type FormEngineOptions, type RecallFormatFn } from '../../src';
import { errorGroups } from '../../src/internal';

const definition = (lang?: string): FormDefinition => ({
  formatVersion: '1.5',
  id: 'f',
  title: 'F',
  ...(lang && { lang }),
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'day', type: 'date', label: 'Day' },
    { key: 'at', type: 'time', label: 'At' },
    { key: 'when', type: 'datetime', label: 'When' },
    { key: 'seats', type: 'number', label: 'Seats' },
    { key: 'score', type: 'scale', label: 'Score' },
    { key: 'stars', type: 'rating', label: 'Stars' },
    {
      key: 'plan',
      type: 'select',
      label: 'Plan',
      options: [
        { value: 'pro', label: 'Pro' },
        { value: 'team', label: 'Team' },
      ],
    },
    {
      key: 'tags',
      type: 'multiselect',
      label: 'Tags',
      options: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
        { value: 'c', label: 'Gamma' },
      ],
    },
    { key: 'agree', type: 'checkbox', label: 'I agree' },
    { key: 'cv', type: 'file', label: 'CV' },
    { key: 'people', type: 'group', label: 'People', fields: [{ key: 'first', type: 'text', label: 'First' }] },
  ],
});

const recall = (text: string, values: Record<string, unknown>, lang = 'en-US') => recallText(definition(lang), text, values);
const digits = (text: string) => text.replace(/\D/g, '');

describe('recall formatting', () => {
  const zone = process.env.TZ;
  afterEach(() => {
    process.env.TZ = zone;
  });

  it('formats a date with the month name and the stored day', () => {
    const text = recall('{{day}}', { day: '2027-06-14' });
    expect(text).not.toContain('2027-06-14');
    expect(text).toContain('Jun');
    expect(digits(text)).toBe('142027');
  });

  it('formats a time and a datetime with the clock of the stored value', () => {
    const at = recall('{{at}}', { at: '14:30' });
    expect(at).not.toBe('14:30');
    expect(at).toMatch(/2:30/);
    const when = recall('{{when}}', { when: '2027-06-14T14:30' });
    expect(when).toContain('Jun');
    expect(digits(when)).toBe('142027230');
  });

  it('groups digits in numbers, scales and ratings', () => {
    expect(recall('{{seats}}', { seats: 4200 })).not.toBe('4200');
    expect(digits(recall('{{seats}}', { seats: 4200 }))).toBe('4200');
    expect(recall('{{score}}|{{stars}}', { score: 3, stars: 4.5 })).toBe('3|4.5');
  });

  it('formats for the form language', () => {
    const day = recall('{{day}}', { day: '2027-06-14' }, 'ru');
    expect(day).not.toContain('Jun');
    expect(day).toMatch(/^14\D+2027/);
    expect(digits(recall('{{seats}}', { seats: 4200 }, 'ru'))).toBe('4200');
    expect(recall('{{tags}}', { tags: ['a', 'b'] }, 'ru')).toMatch(/^Alpha и Beta$/);
  });

  it('lists every label and file name and counts items', () => {
    const tags = recall('{{tags}}', { tags: ['a', 'b', 'c'] });
    expect(tags).not.toBe('Alpha, Beta, Gamma');
    expect(tags).toMatch(/^Alpha, Beta,? and Gamma$/);
    expect(recall('{{tags}}', { tags: ['b'] })).toBe('Beta');
    expect(recall('{{cv}}', { cv: [{ name: 'cv.pdf' }, { name: 'photo.png' }] })).toMatch(/^cv\.pdf and photo\.png$/);
    expect(recall('{{plan}}|{{agree}}|{{people}}', { plan: 'team', agree: true, people: [{}, {}] })).toBe('Team|I agree|2');
  });

  it.each(['Pacific/Kiritimati', 'Etc/GMT+12', 'UTC'])('keeps the stored day and time in %s', (timeZone) => {
    process.env.TZ = timeZone;
    expect(digits(recall('{{day}}', { day: '2027-06-14' }))).toBe('142027');
    expect(digits(recall('{{day}}', { day: '2027-01-01' }))).toBe('12027');
    expect(digits(recall('{{when}}', { when: '2027-06-14T23:59:30Z' }))).toBe('142027' + '1159');
    expect(digits(recall('{{when}}', { when: '2027-06-14T00:00+14:00' }))).toBe('142027' + '1200');
    expect(digits(recall('{{at}}', { at: '00:05' }))).toBe('1205');
  });

  it('collapses whitespace in recalled text', () => {
    expect(recall('[{{name}}]', { name: ' Ada\n\n Lovelace\t' })).toBe('[ Ada Lovelace ]');
    expect(recallText(definition(), '[{{name}}]', { name: 'a\nb' }, { format: (value) => String(value) })).toBe('[a\nb]');
  });

  it('shows unparseable values as stored', () => {
    expect(recall('{{day}}|{{at}}|{{when}}', { day: '2027-02-30', at: '25:00', when: 'soon' })).toBe('2027-02-30|25:00|soon');
  });

  it('falls back to English for unsupported and malformed locales', () => {
    const text = '{{day}}|{{seats}}|{{tags}}';
    const values = { day: '2027-06-14', seats: 4200, tags: ['a', 'b'] };
    expect(recall(text, values, 'zz')).toBe(recall(text, values, 'en'));
    expect(recall(text, values, '!!')).toBe(recall(text, values, 'en'));
  });

  it('never loses digits of a number', () => {
    const show = (stars: number) => recall('{{stars}}', { stars });
    expect(show(1e-21)).toBe('1e-21');
    expect(show(-1e-21)).toBe('-1e-21');
    expect(show(1.5e-7)).toBe('1.5e-7');
    expect(show(0.0000012345678901234567)).toBe('0.0000012345678901234567');
    expect(show(0.1 + 0.2)).toBe('0.30000000000000004');
    expect(show(123456789.12345679)).toBe('123,456,789.12345679');
    expect(show(2 ** 53 + 2)).toBe('9,007,199,254,740,994');
    expect(show(1e21)).toBe('1e+21');
  });

  it('prefers the lang option, then the form language, then English', () => {
    const format = (_: unknown, __: unknown, locale: string) => locale;
    expect(recallText(definition('en-US'), '{{seats}}', { seats: 1 }, { lang: 'de', format })).toBe('de');
    expect(recallText(definition('de'), '{{seats}}', { seats: 1 }, { format })).toBe('de');
    expect(recallText(definition(), '{{seats}}', { seats: 1 }, { format })).toBe('en');
    expect(recallText(definition(), '{{seats}}', { seats: 4200 })).toBe(new Intl.NumberFormat('en').format(4200));
  });

  it('keeps every fraction digit, writes -0 as 0 and formats numbers only in number fields', () => {
    expect(recall('{{stars}}|{{seats}}', { stars: 1.23456789, seats: -0 })).toBe('1.23456789|0');
    const fields = [{ key: 'ref', type: 'hidden' }, ...definition().fields];
    expect(recallText({ ...definition('en-US'), fields }, '{{ref}}', { ref: 4200 })).toBe('4200');
  });

  it('formats times with seconds and keeps malformed stamps as stored', () => {
    expect(digits(recall('{{at}}', { at: '14:30:45' }))).toBe('230');
    expect(recall('{{when}}', { when: '2027-06-14T14:30:99' })).toBe('2027-06-14T14:30:99');
    expect(recall('{{when}}', { when: '2027-06-14T14:30+5' })).toBe('2027-06-14T14:30+5');
    expect(recall('{{at}}', { at: '24:00' })).toBe('24:00');
  });

  it('keys cached formatters by canonical locale and keeps the cache small', () => {
    const create = vi.spyOn(Intl, 'NumberFormat');
    try {
      recall('{{seats}}', { seats: 1 }, 'fr-CA');
      recall('{{seats}}', { seats: 1 }, 'FR-ca');
      expect(create).toHaveBeenCalledTimes(1);
      const variants = Array.from({ length: 100 }, (_, index) => `en-x-${String(index).padStart(8, '0')}`);
      for (const lang of variants) recall('{{seats}}', { seats: 1 }, lang);
      expect(create).toHaveBeenCalledTimes(101);
      recall('{{seats}}', { seats: 1 }, variants[99]);
      expect(create).toHaveBeenCalledTimes(101);
      recall('{{seats}}', { seats: 1 }, variants[0]);
      expect(create).toHaveBeenCalledTimes(102);
    } finally {
      create.mockRestore();
    }
  });

  it('passes the recalled value, field and locale to a custom formatter', () => {
    const format = vi.fn<RecallFormatFn>((value) => `<${String(value)}>`);
    const values = { day: '2027-06-14', tags: ['a'], name: '' };
    expect(recallText(definition('de'), '{{day}} {{tags}} {{name}}', values, { format })).toBe('<2027-06-14> <Alpha> ');
    expect(format.mock.calls.map(([value, field, locale]) => [value, field.key, locale])).toEqual([
      ['2027-06-14', 'day', 'de'],
      [['Alpha'], 'tags', 'de'],
    ]);
  });

  it('skips the formatter for empty answers', () => {
    const format = vi.fn<RecallFormatFn>(() => 'x');
    const values = { agree: false, tags: [], name: '', day: '  ' };
    expect(recallText(definition(), '[{{agree}}][{{tags}}][{{day}}][{{name}}][{{nope}}]', values, { format })).toBe('[][][][][]');
    expect(format).not.toHaveBeenCalled();
    expect(recallText(definition(), '{{seats}}', { seats: 0 }, { format })).toBe('x');
  });

  const summary = (options?: FormEngineOptions) => {
    const engine = new FormEngine(
      {
        ...definition('en-US'),
        fields: [
          { key: 'day', type: 'date', label: 'Day' },
          { key: 'note', type: 'text', label: 'Note for {{day}}', validation: { required: true } },
        ],
      },
      { day: '2027-06-14' },
      options,
    );
    engine.validate();
    return errorGroups(engine, 'f')[0].entries[0].text;
  };

  it('uses the engine formatter and locale in the error summary', () => {
    expect(summary({ formatRecall: (value, field, locale) => `${field.label} ${String(value)} ${locale}` })).toBe(
      'Note for Day 2027-06-14 en-US: This field is required',
    );
    expect(summary({ lang: 'de', formatRecall: (_, __, locale) => locale })).toBe('Note for de: This field is required');
    expect(summary()).not.toContain('2027-06-14');
  });
});
