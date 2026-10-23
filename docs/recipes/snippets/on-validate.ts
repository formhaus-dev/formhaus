import type { ValidateFn } from '@formhaus/core';

export const onValidate: ValidateFn = (values, { fields }) => {
  const players: { name?: string }[] = Array.isArray(values.players) ? values.players : [];
  const names = players.map((player) => player.name?.trim().toLowerCase());
  const errors: Record<string, string> = {};
  names.forEach((name, index) => {
    const path = `players.${index}.name`;
    if (name && fields.includes(path) && names.indexOf(name) !== index) errors[path] = 'Two players have this name';
  });
  if (fields.includes('players') && players.length % 2 === 1) errors[''] = 'Teams need an even number of players';
  return errors;
};
