import { fetchForm } from '@formhaus/core/cloud';
import { FormhausForm } from '@formhaus/react/cloud';

export const revalidate = 60;

export default async function Page() {
  const form = await fetchForm({ id: 'YOUR_FORM_ID' }).catch(() => undefined);
  return <FormhausForm id="YOUR_FORM_ID" initialForm={form} />;
}
