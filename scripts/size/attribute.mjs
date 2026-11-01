import { entryBundleFiles } from './measure.mjs';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const OTHER = '(unmapped)';

function decodeSegment(segment) {
  const fields = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = ALPHABET.indexOf(char);
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
    } else {
      fields.push(value & 1 ? -(value >> 1) : value >> 1);
      value = 0;
      shift = 0;
    }
  }
  return fields;
}

const sourceName = (path) => path.replace(/^(?:\.\.\/)+/, '').replace(/^.*?(?=packages\/)/, '');

export function bytesBySource(js, map) {
  const lines = Buffer.from(js).toString('utf8').split('\n');
  const bytes = {};
  const add = (name, text) => {
    bytes[name] = (bytes[name] ?? 0) + Buffer.byteLength(text);
  };
  let source = 0;
  map.mappings.split(';').forEach((mapping, index) => {
    const line = lines[index] ?? '';
    const segments = mapping === '' ? [] : mapping.split(',').map(decodeSegment);
    add(OTHER, line.slice(0, segments[0]?.[0] ?? line.length));
    let column = 0;
    segments.forEach((fields, position) => {
      column += fields[0];
      if (fields.length > 1) source += fields[1];
      const end = position + 1 < segments.length ? column + segments[position + 1][0] : line.length;
      add(fields.length > 1 ? sourceName(map.sources[source]) : OTHER, line.slice(column, end));
    });
    add(OTHER, '\n');
  });
  return bytes;
}

export async function attributeEntry(name) {
  const { size, js, map } = await entryBundleFiles(name);
  const ratio = size / js.length;
  return Object.fromEntries(Object.entries(bytesBySource(js, map)).map(([source, bytes]) => [source, Math.round(bytes * ratio)]));
}

export function topGrowth(base, head, limit = 5) {
  return [...new Set([...Object.keys(base), ...Object.keys(head)])]
    .map((source) => ({ source, delta: (head[source] ?? 0) - (base[source] ?? 0) }))
    .filter((row) => row.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);
}
