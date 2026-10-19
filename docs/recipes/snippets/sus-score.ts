const points = ['1', '2', '3', '4', '5'];

export function susScore(values: Record<string, unknown>): number | null {
  let sum = 0;
  for (let item = 1; item <= 10; item += 1) {
    const answer = values[`sus${item}`];
    if (typeof answer !== 'string' || !points.includes(answer)) return null;
    sum += item % 2 === 1 ? Number(answer) - 1 : 5 - Number(answer);
  }
  return sum * 2.5;
}
