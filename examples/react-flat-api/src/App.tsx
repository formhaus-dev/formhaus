import { parseDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { useMemo, useState } from 'react';
import { submitTo } from './adapter';
import { createMockApi } from './api';
import account from './account.json';

const definition = parseDefinition(account);
const api = createMockApi({ latency: 400 });

export default function App() {
  const submit = useMemo(() => submitTo(api), []);
  const [offline, setOffline] = useState(false);
  const [requests, setRequests] = useState(api.requests.length);
  const [opened, setOpened] = useState<string | null>(null);

  async function onSubmit(values: Record<string, unknown>) {
    try { return await submit(values); }
    finally { setRequests(api.requests.length); }
  }

  return (
    <div className="demo">
      <main className="demo__main">
        {opened ? (
          <section className="demo__done" role="status">
            <h1>Account opened</h1>
            <p>We sent a confirmation to {opened}.</p>
          </section>
        ) : (
          <FormRenderer
            definition={definition}
            onSubmit={onSubmit}
            errorSummary
            stepErrorMarks
            onAfterSubmit={(values) => setOpened(String(values.email))}
          />
        )}
      </main>
      <aside className="demo__panel">
        <h2>Mock API</h2>
        <p>The server rejects:</p>
        <ul>
          <li>a first name with digits</li>
          <li><code>taken@example.com</code></li>
          <li>emails at <code>@blocked.example</code></li>
          <li>a company name with “test”</li>
          <li>a postcode that starts with 0</li>
        </ul>
        <label className="demo__toggle">
          <input type="checkbox" checked={offline} onChange={(event) => { setOffline(event.target.checked); api.setOffline(event.target.checked); }} />
          Network down
        </label>
        <h2>Last request</h2>
        <pre>{requests > 0 ? JSON.stringify(api.requests[requests - 1], null, 2) : 'None yet'}</pre>
      </aside>
    </div>
  );
}
