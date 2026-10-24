const visible = (frame, text) =>
  frame
    ?.getByText(text, { exact: false })
    .filter({ visible: true })
    .first()
    .waitFor({ timeout: 15000 })
    .then(
      () => true,
      () => false,
    );

export function entryChecks(base, frameOf) {
  async function frame(page, id) {
    for (let attempt = 0; attempt < 50 && !frameOf(page, id); attempt += 1) await page.waitForTimeout(200);
    return frameOf(page, id);
  }

  return {
    async entry(page, problems) {
      await page.goto(`${base}/playground`);
      if (!(await visible(await frame(page, 'react'), 'First Name'))) problems.push('the default preview did not render');
      await page.getByRole('tab', { name: 'MUI' }).click();
      const search = page.locator('.ps-panel').getByRole('combobox');
      await search.fill('bug');
      await page
        .locator('.ps-panel')
        .getByRole('option', { name: /Bug report/ })
        .click();
      if (!(await visible(await frame(page, 'mui'), 'Short summary'))) problems.push('the MUI preview did not render the bug report');
      const href = await page.locator('.lv-bar .lv-open').getAttribute('href');
      if (href !== '/play#ds=mui&t=bug-report') problems.push(`the button points to ${href}`);
      await search.fill('');
      await search.press('ArrowDown');
      const live = await page.locator('.ps-panel [role="option"][aria-selected="true"]').count();
      const moved = await page.locator('.lv-bar__form').textContent();
      if (live !== 1 || moved === 'Bug report') problems.push(`ArrowDown did not select live (${moved})`);
      await page.getByRole('tab', { name: 'MUI' }).focus();
      await page.keyboard.press('End');
      const last = await page.locator('[role="tab"][aria-selected="true"]').textContent();
      if (last?.trim() !== 'USWDS') problems.push(`End selected ${last}`);
    },

    async entryLinks(page, problems) {
      await page.goto(`${base}/playground?ds=mui&f=t:bug-report`);
      await page.locator('.lv-bar .lv-open').click();
      await page.waitForURL(/\/play#ds=mui&t=bug-report$/);
      await page.locator('.cm-content').waitFor({ state: 'attached' });
      const text = await page.evaluate(() => document.querySelector('.cm-content')?.innerText);
      if (!text?.includes('"bug-report"')) problems.push('the editor did not load the bug report');
      const back = page.locator('.play-back');
      if ((await back.getAttribute('href')) !== '/playground') problems.push('the back arrow does not point to /playground');
      await back.click();
      await page.waitForURL(/\/playground\?ds=mui&f=t:bug-report$/);
      const tab = await page.locator('.ps-strip [role="tab"][aria-selected="true"]').textContent();
      if (tab?.trim() !== 'MUI') problems.push(`back on the entry page the selected system is ${tab}`);
    },

    async entryLazy(page, problems) {
      const requests = [];
      page.on('request', (request) => requests.push(new URL(request.url()).pathname));
      await page.route('**/templates/bug-report.json', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 900));
        await route.continue();
      });
      await page.goto(`${base}/playground`);
      if (!(await visible(await frame(page, 'react'), 'First Name'))) problems.push('the default preview did not render');
      const apps = () => new Set(requests.filter((path) => path.startsWith('/play/apps/')).map((path) => path.split('/')[3]));
      const fetched = () => requests.filter((path) => /^\/templates\/.+\.json$/.test(path));
      if (apps().size !== 1 || fetched().length) problems.push(`the first load fetched apps ${[...apps()]} and ${fetched()}`);
      const search = page.locator('.ps-panel').getByRole('combobox');
      await search.fill('bug');
      await page
        .locator('.ps-panel')
        .getByRole('option', { name: /Bug report/ })
        .click();
      const skeleton = page.locator('.lv-stage .play-skeleton');
      if (!(await skeleton.isVisible())) problems.push('no skeleton while the definition loads');
      await skeleton.waitFor({ state: 'detached', timeout: 15000 });
      if (!(await visible(frameOf(page, 'react'), 'Short summary'))) problems.push('the bug report did not render');
      for (const name of ['MUI', 'Ant Design', 'Mantine', 'Vuetify']) {
        await page.getByRole('tab', { name }).click();
        await skeleton.waitFor({ state: 'detached', timeout: 15000 });
      }
      const frames = await page.locator('.lv-frame').count();
      if (frames > 3) problems.push(`${frames} preview frames stay mounted`);
      if (fetched().length !== 1) problems.push(`the bug report was fetched ${fetched().length} times`);
    },

    async entryPhone(page, problems) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${base}/playground`);
      await page.locator('.ps-pick .cb-trigger').click();
      await page.keyboard.type('nps');
      await page.keyboard.press('Enter');
      const title = await page.locator('.ps-pick .cb-trigger__title').textContent();
      if (title !== 'NPS survey') problems.push(`the dropdown picked ${title}`);
      if (await page.locator('.ps-pick .cb-pop').isVisible()) problems.push('the dropdown stayed open');
      const href = await page.locator('.ps-open-under .lv-open').getAttribute('href');
      if (href !== '/play#ds=react&t=nps-survey') problems.push(`the phone button points to ${href}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 0) problems.push(`the page overflows by ${overflow}px`);
    },
  };
}
