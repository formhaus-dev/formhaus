declare module '*?raw' {
  const content: string;
  export default content;
}

declare module 'virtual:schema-runtimes' {
  const urls: Record<'base' | 'zod' | 'valibot' | 'arktype', string>;
  export default urls;
}
