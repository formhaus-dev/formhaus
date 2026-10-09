export interface Plan {
  name: string;
  summary: string;
}

const goals: Record<string, string> = {
  leads: 'lead capture forms',
  surveys: 'surveys and quizzes',
  onboarding: 'onboarding flows',
};

export function recommendPlan(answers: Record<string, unknown>): Plan {
  const focus = goals[String(answers.goal)] ?? 'forms';
  if (answers.audience !== 'team') return { name: 'Starter', summary: `One seat with unlimited ${focus}.` };
  if (answers.teamSize === 'small') return { name: 'Team', summary: `Shared workspace for ${focus}, up to 10 seats.` };
  return { name: 'Business', summary: `SSO, roles and audit log for ${focus} at scale.` };
}
