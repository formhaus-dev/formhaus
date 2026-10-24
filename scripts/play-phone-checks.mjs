import { contact, continueTo, eachApp, pick, sizes } from './play-reveal-checks.mjs';

async function overflow(frame, problems, name) {
  const { wide, outside } = await frame.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const boxes = [...document.querySelectorAll('button, label, input:not([type=radio]):not([type=checkbox]), textarea, select')]
      .map((node) => node.getBoundingClientRect())
      .filter((box) => box.width > 2 && box.height > 2);
    return {
      wide: document.documentElement.scrollWidth - width,
      outside: boxes.filter((box) => box.left < -1 || box.right > width + 1).length,
    };
  });
  if (wide > 0) problems.push(`${name}: the phone preview overflows by ${wide}px`);
  if (outside) problems.push(`${name}: ${outside} controls stick out of the phone preview`);
}

export function phoneChecks(play) {
  const each = eachApp(play);
  return {
    async phone(page, problems) {
      await each(
        page,
        problems,
        contact,
        async (frame, list, name) => {
          await pick(frame, 'Phone');
          await overflow(frame, list, name);
        },
        '&w=phone',
      );
      await each(
        page,
        problems,
        sizes,
        async (frame, list, name) => {
          await continueTo(frame);
          await overflow(frame, list, `${name} step 2`);
        },
        '&w=phone',
      );
    },
  };
}
