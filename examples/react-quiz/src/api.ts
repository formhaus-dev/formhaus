type Lead = Record<string, unknown>;

const leads = new Map<string, Lead>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function saveLead(id: string | null, values: Lead): Promise<string> {
  await delay(600);
  if (String(values.email ?? '').startsWith('fail@')) throw new Error('Could not save your details. Try again.');
  const leadId = id ?? crypto.randomUUID();
  leads.set(leadId, { ...leads.get(leadId), ...values });
  return leadId;
}
