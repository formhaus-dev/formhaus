import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import type { RendererHarness, TestKit } from '../../core/__tests__/renderers/fixtures';
import { flowScenarios } from '../../core/__tests__/renderers/flow.scenarios';
import { focusScenarios } from '../../core/__tests__/renderers/focus.scenarios';
import { idScenarios } from '../../core/__tests__/renderers/ids.scenarios';
import { optionScenarios } from '../../core/__tests__/renderers/options.scenarios';
import { stateScenarios } from '../../core/__tests__/renderers/states.scenarios';
import FormRenderer from '../src/FormRenderer.vue';

const harness: RendererHarness = {
  mount(props) {
    const { rerender } = render(FormRenderer, { props });
    return { update: (next) => rerender(next) };
  },
  async click(element) { await fireEvent.click(element); },
  async type(element, value) { await fireEvent.update(element, value); },
  async submit(form) { await fireEvent.submit(form); },
};

const kit: TestKit = { it, expect, fn: vi.fn, waitFor, screen };

describe('renderer conformance: focus', () => focusScenarios(harness, kit));
describe('renderer conformance: flow', () => flowScenarios(harness, kit));
describe('renderer conformance: states', () => stateScenarios(harness, kit));
describe('renderer conformance: ids', () => idScenarios(harness, kit));
describe('renderer conformance: options', () => optionScenarios(harness, kit));
