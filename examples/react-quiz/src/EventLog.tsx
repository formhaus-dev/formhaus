import type { FormAnalyticsEvent } from '@formhaus/core';

export function describeEvent(event: FormAnalyticsEvent): string {
  if ('stepId' in event) return `${event.type} · ${event.stepId}`;
  if ('fieldKey' in event) return `${event.type} · ${event.fieldKey}`;
  return event.type;
}

export function EventLog({ events }: { events: string[] }) {
  return (
    <aside className="quiz__log" aria-label="Funnel events">
      <h2>Funnel events</h2>
      <ol>
        {events.map((event, index) => <li key={index}>{event}</li>)}
      </ol>
    </aside>
  );
}
