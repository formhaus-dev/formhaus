export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const LINK_ERROR = 'Use an https link or upload the image';
export const TYPE_ERROR = 'Use a PNG, JPEG, WebP or GIF image';
export const SIZE_ERROR = 'Images can be up to 5 MB';

export function checkImageFile(file: File): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return TYPE_ERROR;
  if (file.size > MAX_IMAGE_BYTES) return SIZE_ERROR;
  if (file.size === 0) return TYPE_ERROR;
  return null;
}

const PLAIN_HOST = /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*(?::[0-9]{1,5})?$/;
const PLAIN_TAIL = /^[\x21-\x5b\x5d-\x7e]*$/;
const BAD_ESCAPE = /%(?![0-9A-Fa-f]{2})/;

export function httpsLink(value: string): string | null {
  const link = value.trim();
  if (!link.startsWith('https://')) return null;
  const rest = link.slice('https://'.length);
  const end = rest.search(/[/?#]/);
  const host = end < 0 ? rest : rest.slice(0, end);
  const tail = end < 0 ? '' : rest.slice(end);
  if (!PLAIN_HOST.test(host) || !PLAIN_TAIL.test(tail) || BAD_ESCAPE.test(tail)) return null;
  return link;
}

export const isEmbedded = (src: string) => /^data:/i.test(src.trim());

export interface ImageSummary {
  title: string;
  detail?: string;
}

function fileName(url: URL): string {
  const last = url.pathname.split('/').filter(Boolean).at(-1) ?? '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

export function summarize(src: string, uploaded: boolean): ImageSummary {
  if (isEmbedded(src)) return { title: 'Embedded image' };
  if (uploaded) return { title: 'Uploaded image' };
  try {
    const url = new URL(src);
    const name = fileName(url);
    return name ? { title: name, detail: url.hostname } : { title: url.hostname };
  } catch {
    return { title: 'Image link' };
  }
}

export function imageFrom(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const file of Array.from(data.files)) {
    if (file.type.startsWith('image/')) return file;
  }
  return data.files[0] ?? null;
}
