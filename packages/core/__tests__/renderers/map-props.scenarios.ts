import type { FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

export function mapPropsScenarios(harness: RendererHarness, { it, expect, fn, waitFor, screen }: TestKit): void {
  const mapped = harness.mapped!;
  const send = () => harness.click(screen.getByRole('button', { name: 'Send' }));
  const free: FormDefinition = {
    id: 'free',
    title: '',
    submit: { label: 'Send' },
    fields: [
      {
        key: 'city',
        type: 'autocomplete',
        label: 'City',
        options: [
          { value: 'de', label: 'Germany' },
          { value: 'nl', label: 'Netherlands' },
        ],
      },
      { key: 'bio', type: 'textarea', label: 'Bio', rows: 6 },
      { key: 'cv', type: 'file', label: 'CV', accept: '.pdf' },
      {
        key: 'mood',
        type: 'scale',
        label: 'Mood',
        validation: { min: 1, max: 3 },
        options: [
          { value: '1', label: 'Sad' },
          { value: '3', label: 'Happy' },
        ],
      },
    ],
  };

  it('passes rows and accept and saves the picked file', async () => {
    const onSubmit = fn();
    harness.mount({ definition: free, components: mapped.plain, onSubmit });
    expect(screen.getByLabelText('Bio').getAttribute('rows')).toBe('6');
    const cv = screen.getByLabelText('CV') as HTMLInputElement;
    expect([cv.type, cv.accept, cv.hasAttribute('value')]).toEqual(['file', '.pdf', false]);
    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
    Object.defineProperty(cv, 'files', { value: [file], configurable: true });
    cv.dispatchEvent(new Event('change', { bubbles: true }));
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].cv).toBe(file);
  });

  it('gives a group shell the scale anchors', () => {
    harness.mount({ definition: free, components: mapped.plain, onSubmit: fn() });
    expect(screen.getByRole('group', { name: 'Mood' }).getAttribute('data-anchors')).toBe('Sad||Happy');
  });

  it('shows typed text and saves option values with freeText', async () => {
    const onSubmit = fn();
    harness.mount({ definition: free, components: mapped.typed, initialValues: { city: 'de' }, onSubmit });
    const city = screen.getByLabelText('City') as HTMLInputElement;
    expect(city.value).toBe('Germany');
    await harness.type(city, 'Nether');
    await waitFor(() => expect(city.value).toBe('Nether'));
    await harness.type(city, 'Netherlands');
    await waitFor(() => expect(city.value).toBe('Netherlands'));
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].city).toBe('nl');
    await harness.type(city, 'Paris');
    await waitFor(() => expect(city.value).toBe('Paris'));
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0].city).toBe('Paris');
  });

  it('passes option values to an autocomplete without freeText', async () => {
    const onSubmit = fn();
    harness.mount({ definition: free, components: mapped.plain, initialValues: { city: 'de' }, onSubmit });
    const city = screen.getByLabelText('City') as HTMLInputElement;
    expect(city.value).toBe('de');
    await harness.type(city, 'nl');
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].city).toBe('nl');
  });
}
