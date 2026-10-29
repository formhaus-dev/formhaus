import { schemaValidate } from '@formhaus/core/schema';
import { z } from 'zod';

const texts = {
  en: { name: 'Use at least 2 letters', players: 'Up to 5 players' },
  de: { name: 'Mindestens 2 Buchstaben', players: 'Höchstens 5 Spieler' },
};

export type Lang = keyof typeof texts;

export function validateIn(lang: Lang) {
  const text = texts[lang];
  return schemaValidate(z.object({ players: z.array(z.object({ name: z.string().min(2, text.name) })).max(5, text.players) }));
}
