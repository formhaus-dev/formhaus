import { FormRenderer } from '@formhaus/react';
import type { FormDefinition, StepChangeContext } from '@formhaus/core';
import { useRef, useState } from 'react';
import { saveLead } from './api';
import { EventLog, describeEvent } from './EventLog';
import { recommendPlan } from './plan';
import quiz from './quiz.json';

const definition = quiz as FormDefinition;

export default function App() {
  const leadId = useRef<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [stepId, setStepId] = useState(definition.steps![0].id);
  const [events, setEvents] = useState<string[]>([]);
  const [booked, setBooked] = useState(false);
  const plan = recommendPlan(answers);

  async function captureLead({ fromStepId, direction, values }: StepChangeContext) {
    if (fromStepId !== 'contact' || direction !== 'next') return;
    leadId.current = await saveLead(leadId.current, values);
    setEvents((list) => [...list, `lead_saved · ${leadId.current!.slice(0, 8)}`]);
  }

  async function bookCall(values: Record<string, unknown>) {
    leadId.current = await saveLead(leadId.current, values);
    setBooked(true);
  }

  return (
    <div className="quiz">
      <main className="quiz__main">
        {booked ? (
          <section className="quiz__card">
            <h1>You're all set</h1>
            <p>We'll send the {plan.name} plan to {String(answers.email)}.</p>
          </section>
        ) : (
          <>
            {stepId === 'call' && (
              <section className="quiz__card">
                <h1>{plan.name}</h1>
                <p>{plan.summary}</p>
              </section>
            )}
            <FormRenderer
              definition={definition}
              onFieldChange={(_key, _value, values) => setAnswers({ ...values })}
              onStepChange={setStepId}
              onBeforeStepChange={captureLead}
              onAnalyticsEvent={(event) => setEvents((list) => [...list, describeEvent(event)])}
              onSubmit={bookCall}
            />
          </>
        )}
      </main>
      <EventLog events={events} />
    </div>
  );
}
