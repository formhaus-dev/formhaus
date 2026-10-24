import { apps } from './play-server.mjs';

const TOLERANCE = 4;

async function formWidth(frame) {
  await frame.locator('form').first().waitFor({ timeout: 15000 });
  await frame.page().waitForTimeout(300);
  return frame.evaluate(() => Math.round(document.querySelector('form').getBoundingClientRect().width));
}

function compare(problems, place, widths) {
  const values = Object.values(widths);
  if (Math.max(...values) - Math.min(...values) > TOLERANCE) problems.push(`${place}: form widths differ ${JSON.stringify(widths)}`);
}

export function widthChecks(base, { open, frameOf }) {
  async function frameFor(page, id) {
    for (let attempt = 0; attempt < 50 && !frameOf(page, id); attempt += 1) await page.waitForTimeout(200);
    return frameOf(page, id);
  }

  return {
    async formWidths(page, problems) {
      const entry = {};
      const play = {};
      for (const app of apps) {
        await page.goto(`${base}/playground?ds=${app.id}&f=t:contact-form`);
        entry[app.id] = await formWidth(await frameFor(page, app.id));
        await open(page, `/play#ds=${app.id}&t=contact-form`);
        play[app.id] = await formWidth(frameOf(page, app.id));
      }
      console.log(`form widths /playground ${JSON.stringify(entry)}\nform widths /play ${JSON.stringify(play)}`);
      compare(problems, '/playground', entry);
      compare(problems, '/play 1440', play);
    },
  };
}
