import type { FormDefinition, FormField } from '@formhaus/core';
import { element, iconButton } from '../dom';
import { icon } from '../icons';
import { DEFAULT_LAYOUT, type FormLayout } from '../../render-actions';
import { addLink, buttonsBlock } from './buttons';
import { labelled, textInput } from './controls';
import { fieldRow, typeSelect } from './field-row';
import { addField, addStep, isMultiStep, moveField, removeField, removeStep, steps } from './model';

export interface FormEditor {
  get(): FormDefinition;
  layout(): FormLayout;
  set(draft: FormDefinition, layout?: FormLayout): void;
}

type Position = [number, number];

export function createEditor(container: HTMLElement, onChange: () => void, notify: (text: string) => void): FormEditor {
  let draft: FormDefinition = { id: 'form', title: '', submit: { label: 'Submit' }, fields: [] };
  const open = new WeakSet<FormField>();
  let dragging: Position | null = null;
  let layout: FormLayout = DEFAULT_LAYOUT;

  function update(focusKey?: string, selector = '.label-input'): void {
    render();
    onChange();
    if (focusKey) container.querySelector<HTMLElement>(`.field-row[data-key="${CSS.escape(focusKey)}"] ${selector}`)?.focus();
  }

  function guarded(message: string | null): void {
    if (message) notify(message);
    else update();
  }

  function dropTarget(row: HTMLElement, position: Position): void {
    const isAfter = (event: DragEvent) => event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
    row.addEventListener('dragover', (event) => {
      if (!dragging) return;
      event.preventDefault();
      row.classList.toggle('drop-after', isAfter(event));
      row.classList.toggle('drop-before', !isAfter(event));
    });
    row.addEventListener('dragleave', () => row.classList.remove('drop-before', 'drop-after'));
    row.addEventListener('drop', (event) => {
      if (!dragging) return;
      event.preventDefault();
      moveField(draft, dragging, [position[0], position[1] + (isAfter(event) ? 1 : 0)]);
      dragging = null;
      update();
    });
  }

  function movable(row: HTMLElement, position: Position, field: FormField, count: number): void {
    const handle = row.querySelector<HTMLElement>('.drag-handle')!;
    handle.draggable = true;
    handle.addEventListener('dragstart', (event) => {
      dragging = position;
      event.dataTransfer?.setDragImage(row, 16, 16);
      row.classList.add('is-dragging');
    });
    handle.addEventListener('dragend', () => {
      dragging = null;
      render();
    });
    handle.addEventListener('keydown', (event) => {
      const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
      const target = position[1] + delta;
      if (!delta || target < 0 || target >= count) return;
      event.preventDefault();
      moveField(draft, position, [position[0], delta > 0 ? target + 1 : target]);
      update(field.key, '.drag-handle');
    });
    dropTarget(row, position);
  }

  function stepSection(stepIndex: number): HTMLElement {
    const step = steps(draft)[stepIndex];
    const section = element('section', 'step');
    if (isMultiStep(draft)) {
      const header = element('header', 'step-header');
      header.append(
        element('span', 'step-number', String(stepIndex + 1)),
        textInput(step.title, 'Step title', 'input step-title', (value) => { step.title = value; onChange(); }),
        iconButton('delete', 'Delete step', () => guarded(removeStep(draft, stepIndex))),
      );
      section.appendChild(header);
    }
    const list = element('div', 'field-list');
    step.fields.forEach((field, fieldIndex) => {
      const row = fieldRow(field, {
        draft,
        changed: onChange,
        rerender: () => update(),
        remove: () => guarded(removeField(draft, stepIndex, fieldIndex)),
        isOpen: (item) => open.has(item),
        toggle: (item) => { if (open.has(item)) open.delete(item); else open.add(item); render(); },
      });
      movable(row, [stepIndex, fieldIndex], field, step.fields.length);
      list.appendChild(row);
    });
    if (step.fields.length === 0 && isMultiStep(draft)) {
      const empty = element('div', 'field-empty', 'No fields yet. Drag one here or add it below.');
      dropTarget(empty, [stepIndex, 0]);
      list.appendChild(empty);
    }
    const add = element('label', 'add-field');
    add.append(icon('add', 14), element('span', '', 'Add field'));
    const picker = typeSelect('', (type) => {
      const field = addField(draft, stepIndex, type);
      open.add(field);
      update(field.key);
    }, 'add-select');
    picker.setAttribute('aria-label', 'Add field of type');
    picker.prepend(Object.assign(element('option', '', 'Choose type'), { value: '', disabled: true }));
    picker.value = '';
    add.appendChild(picker);
    const count = steps(draft).length;
    const onePage = layout.steps === 'page' && count > 1;
    section.append(list, add);
    if (!onePage || stepIndex === count - 1) section.append(buttonsBlock(step, stepIndex, count, isMultiStep(draft) && !onePage, { draft, changed: onChange, rerender: () => update() }));
    return section;
  }

  function layoutPicker<K extends keyof FormLayout>(key: K, title: string, options: [FormLayout[K], string][]): HTMLElement {
    const group = element('div', 'segmented small');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', title);
    for (const [value, text] of options) {
      const option = element('button', value === layout[key] ? 'mode active' : 'mode', text);
      option.type = 'button';
      option.setAttribute('aria-pressed', String(value === layout[key]));
      option.onclick = () => { layout = { ...layout, [key]: value }; update(); };
      group.appendChild(option);
    }
    return labelled(title, group, 'head-row', 'section-label');
  }

  function render(): void {
    const head = element('div', 'form-head');
    head.append(
      labelled('Form title', textInput(draft.title, 'Sign up', 'input title-input', (value) => { draft.title = value; onChange(); }, 'Form title'), 'head-field', 'section-label'),
      ...(steps(draft).length > 1 ? [layoutPicker('steps', 'Steps', [['screens', 'Separate'], ['page', 'One page']])] : []),
      layoutPicker('actions', 'Buttons', [['stacked', 'Stacked'], ['inline', 'Side by side']]),
    );
    const addStepButton = addLink(isMultiStep(draft) ? 'Add step' : 'Split into steps', () => { addStep(draft); update(); });
    container.replaceChildren(head, ...steps(draft).map((_, index) => stepSection(index)), addStepButton);
  }

  return {
    get: () => draft,
    layout: () => layout,
    set(next, nextLayout = DEFAULT_LAYOUT) {
      draft = structuredClone(next);
      layout = nextLayout;
      render();
    },
  };
}
