import { FormhausForm } from '@formhaus/react/cloud';
import '@formhaus/core/style.css';

const FORM_ID = 'YOUR_FORM_ID';

export function App() {
  return (
    <main style={{ maxWidth: 560, margin: '48px auto', padding: '0 16px' }}>
      <h1>Join the waitlist</h1>
      <FormhausForm id={FORM_ID} />
    </main>
  );
}
