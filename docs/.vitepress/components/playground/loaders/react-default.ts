export function buildFiles(definitionJson: string) {
  return {
    '/App.tsx': `import { FormRenderer } from "@formhaus/react";

const definition = ${definitionJson};

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: "24px auto", fontFamily: "sans-serif" }}>
      <FormRenderer
        definition={definition}
        onSubmit={(values) => console.log("Submitted:", values)}
      />
    </div>
  );
}`,
  };
}

export const template = 'react-ts' as const;
export const entry: string | undefined = undefined;
export const activeFile = '/App.tsx';
export const visibleFiles = ['/App.tsx'];
export const editorHeight = 480;
export const deps: Record<string, string> = {
  '@formhaus/core': '0.3.1',
  '@formhaus/react': '0.3.1',
  'react': '18.3.1',
  'react-dom': '18.3.1',
};
