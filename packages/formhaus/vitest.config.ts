import { defineConfig } from 'vitest/config';

const textFile = /\.mdc?$/;

export default defineConfig({
  plugins: [{ name: 'text-files', transform: (code, id) => (textFile.test(id) ? `export default ${JSON.stringify(code)};` : undefined) }],
  test: {
    environment: 'node',
  },
});
