const selectAll = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';

export function playPage(base) {
  async function open(page, path = '/play') {
    await page.goto(base + path);
    await page.locator('.cm-content').waitFor({ state: 'attached' });
    await rendered(page);
  }

  async function rendered(page) {
    await page.locator('.play-loading').waitFor({ state: 'detached', timeout: 20000 });
  }

  function frameOf(page, id) {
    return page.frames().find((frame) => frame.url().includes(`/play/apps/${id}/`));
  }

  async function edit(page, text) {
    if (await page.locator('.play-tabs').isVisible()) await page.getByRole('button', { name: 'JSON', exact: true }).click();
    await page.locator('.cm-content').click();
    await page.keyboard.press(selectAll);
    await page.keyboard.press('Backspace');
    if (text) await page.keyboard.insertText(text);
    await page.waitForTimeout(600);
  }

  const tone = (frame) =>
    frame.evaluate(() => {
      const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      let element = document.querySelector('form') ?? document.body;
      while (element) {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = getComputedStyle(element).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
        if (alpha > 128) return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
        element = element.parentElement;
      }
      return 1;
    });

  return { open, rendered, frameOf, edit, tone };
}
