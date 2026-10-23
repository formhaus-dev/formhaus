import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RendererHarness, ScenarioProps, TestKit } from '../../core/__tests__/renderers/fixtures';
import { controlScenarios } from '../../core/__tests__/renderers/controls.scenarios';
import { containerScenarios } from '../../core/__tests__/renderers/containers.scenarios';
import { definitionScenarios } from '../../core/__tests__/renderers/definition.scenarios';
import { dialogScenarios } from '../../core/__tests__/renderers/dialog.scenarios';
import { fieldScenarios } from '../../core/__tests__/renderers/fields.scenarios';
import { flowScenarios } from '../../core/__tests__/renderers/flow.scenarios';
import { recallScenarios } from '../../core/__tests__/renderers/recall.scenarios';
import { focusScenarios } from '../../core/__tests__/renderers/focus.scenarios';
import { labelScenarios } from '../../core/__tests__/renderers/labels.scenarios';
import { idScenarios } from '../../core/__tests__/renderers/ids.scenarios';
import { exclusiveScenarios } from '../../core/__tests__/renderers/exclusive.scenarios';
import { randomizeScenarios } from '../../core/__tests__/renderers/randomize.scenarios';
import { optionScenarios } from '../../core/__tests__/renderers/options.scenarios';
import { sourceScenarios } from '../../core/__tests__/renderers/sources.scenarios';
import { summaryScenarios } from '../../core/__tests__/renderers/summary.scenarios';
import { stateScenarios } from '../../core/__tests__/renderers/states.scenarios';
import { FormRenderer } from '../src/FormRenderer';
import type { ConfirmDialogComponentProps, FieldComponentProps, GroupComponentProps, SectionComponentProps } from '../src/types';

const controls = {
  'x-knob': ({ id, field, error, loading }: FieldComponentProps) => (
    <div
      id={id}
      role="listbox"
      tabIndex={0}
      aria-label={field.label}
      aria-invalid={!!error || undefined}
      data-loading={loading || undefined}
    />
  ),
  'x-dial': ({ id, field, error }: FieldComponentProps) => (
    <div id={id} role="group" aria-invalid={!!error || undefined}>
      <span role="button" tabIndex={0} aria-disabled="true" aria-label="Locked" />
      <div role="slider" tabIndex={0} aria-label={field.label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={0} />
    </div>
  ),
};

const containers = {
  section: ({ title, children }: SectionComponentProps) => (
    <div>
      <h3>{title}</h3>
      {children}
    </div>
  ),
  group: ({ id, label, items, canAdd, add }: GroupComponentProps) => (
    <div id={id}>
      <span>
        {label}: {items.length}
      </span>
      {items.map((item) => (
        <div key={item.id} data-fh-group-item>
          <span id={item.titleId} tabIndex={-1}>
            {item.title}
          </span>
          <button type="button" onClick={item.remove}>
            Drop {item.title}
          </button>
          {item.children}
        </div>
      ))}
      <button type="button" disabled={!canAdd} onClick={add} data-fh-group-add>
        More
      </button>
    </div>
  ),
  confirmDialog: ({ title, confirm }: ConfirmDialogComponentProps) => (
    <div>
      <p>{title}</p>
      <button type="button" onClick={confirm}>
        Yes
      </button>
    </div>
  ),
};

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
  containers,
  controls,
};

const kit: TestKit = { it, expect, fn: vi.fn, waitFor, screen };

describe('renderer conformance: focus', () => focusScenarios(harness, kit));
describe('renderer conformance: flow', () => flowScenarios(harness, kit));
describe('renderer conformance: recall', () => recallScenarios(harness, kit));
describe('renderer conformance: error summary', () => summaryScenarios(harness, kit));
describe('renderer conformance: labels', () => labelScenarios(harness, kit));
describe('renderer conformance: states', () => stateScenarios(harness, kit));
describe('renderer conformance: fields', () => fieldScenarios(harness, kit));
describe('renderer conformance: ids', () => idScenarios(harness, kit));
describe('renderer conformance: options', () => optionScenarios(harness, kit));
describe('renderer conformance: exclusive options', () => exclusiveScenarios(harness, kit));
describe('renderer conformance: randomized options', () => randomizeScenarios(harness, kit));
describe('renderer conformance: sources', () => sourceScenarios(harness, kit));
describe('renderer conformance: custom controls', () => controlScenarios(harness, kit));
describe('renderer conformance: sections and groups', () => containerScenarios(harness, kit));
describe('renderer conformance: remove dialog', () => dialogScenarios(harness, kit));
describe('renderer conformance: definition changes', () => definitionScenarios(harness, kit));
