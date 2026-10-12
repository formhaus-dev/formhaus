import type { FormDefinition } from '@formhaus/core';

export type StartChoice = 'browser' | 'agent' | 'project';

export const choices: Record<StartChoice, { label: string; text: string; icon: 'globe' | 'bot' | 'code'; title: string }> = {
  browser: { label: 'In the browser', text: 'Build a form here and get a link. No signup.', icon: 'globe', title: 'New form' },
  agent: { label: 'With your AI agent', text: 'Claude Code, Cursor or any MCP client.', icon: 'bot', title: 'Connect your AI agent' },
  project: { label: 'In my project', text: 'Install for React, Vue or any framework.', icon: 'code', title: 'Add it to your project' },
};

export const definition: FormDefinition = {
  id: 'onboarding',
  title: 'How do you want to start?',
  steps: [
    {
      id: 'start',
      title: 'How do you want to start?',
      next: false,
      fields: [
        {
          key: 'start',
          type: 'radio',
          label: 'How do you want to start?',
          autoAdvance: true,
          options: Object.entries(choices).map(([value, choice]) => ({ value, label: choice.label })),
        },
      ],
    },
    { id: 'done', title: 'Next', fields: [{ key: 'ack', type: 'text', label: 'Next' }] },
  ],
};
