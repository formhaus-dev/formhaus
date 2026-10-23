import { useEffect, useState } from 'react';
import type { FormDefinition, LocaleCatalog } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { loadLocale } from './locale-catalogs.js';

type Props = { definition: FormDefinition; send: (values: Record<string, unknown>) => Promise<void> };

export function SignupPage({ definition, send }: Props) {
  const [locale, setLocale] = useState<LocaleCatalog[]>();
  useEffect(() => {
    loadLocale(navigator.language).then(setLocale);
  }, []);
  return <FormRenderer definition={definition} locale={locale} onSubmit={send} />;
}
