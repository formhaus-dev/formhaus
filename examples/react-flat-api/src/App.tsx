import { parseDefinition, type SubmitResult } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { useMemo, useState } from 'react';
import { submitTo } from './adapter';
import { createMockApi, type ForcedRejection } from './api';
import account from './account.json';

const definition = parseDefinition(account);
const api = createMockApi({ latency: 400 });

const toggles: [ForcedRejection, string][] = [
  ['first_name', 'Reject first name'],
  ['email', 'Reject email'],
  ['company_name', 'Reject company'],
  ['postal_code', 'Reject postcode'],
  ['account', 'Unknown key error'],
  ['general', 'General error'],
];

const testData = {
  firstName: 'Ann',
  lastName: 'Lee',
  email: 'ann@example.com',
  accountType: 'business',
  companyName: 'Acme',
  street: '1 Main St',
  postcode: '12345',
};

export default function App() {
  const submit = useMemo(() => submitTo(api), []);
  const [offline, setOffline] = useState(false);
  const [forced, setForced] = useState<ForcedRejection[]>([]);
  const [requests, setRequests] = useState(api.requests.length);
  const [opened, setOpened] = useState<string | null>(null);
  const [seed, setSeed] = useState<{ run: number; values?: Record<string, unknown> }>({ run: 0 });

  async function onSubmit(values: Record<string, unknown>): Promise<SubmitResult> {
    try {
      return await submit(values);
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      return { ok: false, formErrors: ['Could not reach the server. Check your connection and try again.'] };
    } finally {
      setRequests(api.requests.length);
    }
  }

  function toggle(key: ForcedRejection, on: boolean) {
    api.reject(key, on);
    setForced(on ? [...forced, key] : forced.filter((item) => item !== key));
  }

  function restart(values?: Record<string, unknown>) {
    setOpened(null);
    setSeed({ run: seed.run + 1, values });
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
            key={seed.run}
            initialValues={seed.values}
            definition={definition}
            onSubmit={onSubmit}
            stepErrorMarks
            onAfterSubmit={(values) => setOpened(String(values.email))}
          />
        )}
      </main>
      <aside className="demo__panel">
        <div className="demo__actions">
          <button type="button" onClick={() => restart(testData)}>
            Fill test data
          </button>
          <button type="button" onClick={() => restart()}>
            Clear
          </button>
        </div>
        <h2>Mock API</h2>
        <p>The server rejects:</p>
        <ul>
          <li>a first name with digits</li>
          <li>
            <code>taken@example.com</code>
          </li>
          <li>
            emails at <code>@blocked.example</code>
          </li>
          <li>a company name with “test”</li>
          <li>a postcode that starts with 0</li>
        </ul>
        <h2>Force a response</h2>
        <div className="demo__toggles">
          {toggles.map(([key, label]) => (
            <label key={key} className="demo__toggle">
              <input type="checkbox" checked={forced.includes(key)} onChange={(event) => toggle(key, event.target.checked)} />
              {label}
            </label>
          ))}
          <label className="demo__toggle">
            <input
              type="checkbox"
              checked={offline}
              onChange={(event) => {
                setOffline(event.target.checked);
                api.setOffline(event.target.checked);
              }}
            />
            Network down
          </label>
        </div>
        <h2>Last request</h2>
        <pre>{requests > 0 ? JSON.stringify(api.requests[requests - 1], null, 2) : 'None yet'}</pre>
      </aside>
    </div>
  );
}
