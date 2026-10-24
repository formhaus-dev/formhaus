import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { App as AntApp, Card, ConfigProvider, Form, theme } from 'antd';
import { useState } from 'react';
import { components, layout } from './component-map';
import json from './definition.json';

const initial = parseDefinition(json);

interface AppProps {
  definition?: FormDefinition;
  mode?: 'light' | 'dark';
}

export function App({ definition = initial, mode = 'light' }: AppProps) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <ConfigProvider theme={{ algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <AntApp className="page">
        <Card title={definition.title} className="form-card">
          {submitted ? (
            <pre>{JSON.stringify(submitted, null, 2)}</pre>
          ) : (
            <Form layout="vertical" component={false}>
              <FormRenderer definition={definition} components={components} layout={layout} onSubmit={setSubmitted} />
            </Form>
          )}
        </Card>
      </AntApp>
    </ConfigProvider>
  );
}
