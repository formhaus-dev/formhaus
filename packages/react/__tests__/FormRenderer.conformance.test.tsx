import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RendererHarness, ScenarioProps, TestKit } from '../../core/__tests__/renderers/fixtures';
import { fieldScenarios } from '../../core/__tests__/renderers/fields.scenarios';
import { flowScenarios } from '../../core/__tests__/renderers/flow.scenarios';
import { focusScenarios } from '../../core/__tests__/renderers/focus.scenarios';
import { idScenarios } from '../../core/__tests__/renderers/ids.scenarios';
import { optionScenarios } from '../../core/__tests__/renderers/options.scenarios';
import { stateScenarios } from '../../core/__tests__/renderers/states.scenarios';
import { FormRenderer } from '../src/FormRenderer';

const harness: RendererHarness = {
  mount(props) {
    let current: ScenarioProps = props;
    const { rerender } = render(<FormRenderer {...current} />);
    return {
      async update(next) {
        current = { ...current, ...next };
        rerender(<FormRenderer {...current} />);
      },
    };
  },
  async click(element) {
    fireEvent.click(element);
  },
  async type(element, value) {
    fireEvent.change(element, { target: { value } });
  },
  async submit(form) {
    fireEvent.submit(form);
  },
};

const kit: TestKit = { it, expect, fn: vi.fn, waitFor, screen };

describe('renderer conformance: focus', () => focusScenarios(harness, kit));
describe('renderer conformance: flow', () => flowScenarios(harness, kit));
describe('renderer conformance: states', () => stateScenarios(harness, kit));
describe('renderer conformance: fields', () => fieldScenarios(harness, kit));
describe('renderer conformance: ids', () => idScenarios(harness, kit));
describe('renderer conformance: options', () => optionScenarios(harness, kit));
