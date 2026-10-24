import type { FormDefinition } from '@formhaus/core';
import { HeadlessFormRenderer } from '@formhaus/react';
import { components } from './component-map';
import { layout } from './layout';

export function App({ definition }: { definition: FormDefinition }) {
  return (
    <main className="grid-container app">
      {definition.title && <h1 className="app__title">{definition.title}</h1>}
      <HeadlessFormRenderer
        definition={definition}
        components={components}
        layout={layout}
        onSubmit={(values) => {
          console.log('Submitted:', values);
        }}
      />
    </main>
  );
}
