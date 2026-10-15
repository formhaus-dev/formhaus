import type { EditorView } from '@codemirror/view';
import { getNonce } from 'get-nonce';

export interface JsonEditorHandle {
  setDoc: (text: string) => void;
  getDoc: () => string;
  setError: (error: { message: string; from: number } | null) => void;
  focus: () => void;
  select: (from: number, to: number) => void;
  destroy: () => void;
}

export interface JsonEditorOptions {
  doc: string;
  label: string;
  readOnly: boolean;
  onChange: (text: string) => void;
  onBlur: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export async function mountJsonEditor(parent: HTMLElement, options: JsonEditorOptions): Promise<JsonEditorHandle> {
  const [view, state, lang, language, commands, lint, lezer] = await Promise.all([
    import('@codemirror/view'),
    import('@codemirror/state'),
    import('@codemirror/lang-json'),
    import('@codemirror/language'),
    import('@codemirror/commands'),
    import('@codemirror/lint'),
    import('@lezer/highlight'),
  ]);
  const { tags } = lezer;
  const highlight = language.HighlightStyle.define([
    { tag: tags.propertyName, color: 'var(--fh-ed-accent)' },
    { tag: tags.string, color: 'var(--fh-ed-success)' },
    { tag: [tags.number, tags.bool, tags.null], color: 'var(--fh-ed-warning)' },
    { tag: [tags.punctuation, tags.separator, tags.brace, tags.squareBracket], color: 'var(--fh-ed-fg-muted)' },
  ]);
  const theme = view.EditorView.theme({
    '&': { height: 'auto', color: 'var(--fh-ed-fg)', backgroundColor: 'transparent', fontSize: 'var(--fh-ed-font-size-sm)' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: 'var(--fh-ed-font-family-mono)', lineHeight: '1.6', overflow: 'visible' },
    '.cm-content': { padding: 'var(--fh-ed-space-3) 0 var(--fh-ed-space-6)', caretColor: 'var(--fh-ed-fg)' },
    '.cm-gutters': { border: 'none', color: 'var(--fh-ed-fg-subtle)', backgroundColor: 'transparent' },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: 'var(--fh-ed-space-10)', paddingInline: '0 var(--fh-ed-space-2)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--fh-ed-fg)' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'var(--fh-ed-accent-soft)',
    },
    '.cm-matchingBracket': { outline: 'var(--fh-ed-border-thin) solid var(--fh-ed-line-strong)', backgroundColor: 'transparent' },
    '.cm-tooltip': { border: 'var(--fh-ed-border-thin) solid var(--fh-ed-line)', backgroundColor: 'var(--fh-ed-panel)' },
  });
  let muted = false;
  const replace = (editor: EditorView, text: string) => {
    const current = editor.state.doc.toString();
    let start = 0;
    while (start < current.length && start < text.length && current[start] === text[start]) start++;
    let end = 0;
    while (end < current.length - start && end < text.length - start && current[current.length - 1 - end] === text[text.length - 1 - end])
      end++;
    muted = true;
    editor.dispatch({ changes: { from: start, to: current.length - end, insert: text.slice(start, text.length - end) } });
    muted = false;
  };
  const run = (action: () => void) => () => {
    action();
    return true;
  };
  const editor = new view.EditorView({
    parent,
    state: state.EditorState.create({
      doc: options.doc,
      extensions: [
        view.lineNumbers(),
        view.drawSelection(),
        view.EditorView.lineWrapping,
        language.bracketMatching(),
        language.indentOnInput(),
        lang.json(),
        lint.lintGutter(),
        language.syntaxHighlighting(highlight),
        theme,
        view.EditorView.cspNonce.of(getNonce() ?? ''),
        state.EditorState.readOnly.of(options.readOnly),
        view.EditorView.contentAttributes.of({ 'aria-label': options.label }),
        view.EditorView.scrollMargins.of((editor) => {
          const bar = editor.dom.ownerDocument.querySelector('[data-topbar]');
          return bar ? { top: Math.max(0, bar.getBoundingClientRect().bottom) + editor.defaultLineHeight } : null;
        }),
        view.keymap.of([
          { key: 'Mod-z', run: run(options.onUndo), preventDefault: true },
          { key: 'Mod-Shift-z', run: run(options.onRedo), preventDefault: true },
          { key: 'Mod-y', run: run(options.onRedo), preventDefault: true },
          commands.indentWithTab,
          ...commands.defaultKeymap,
        ]),
        view.EditorView.updateListener.of((update) => {
          if (update.docChanged && !muted) options.onChange(update.state.doc.toString());
          if (update.focusChanged && !update.view.hasFocus) options.onBlur();
        }),
      ],
    }),
  });
  return {
    setDoc: (text) => {
      if (text !== editor.state.doc.toString()) replace(editor, text);
    },
    getDoc: () => editor.state.doc.toString(),
    setError: (error) => {
      const at = error ? Math.min(error.from, editor.state.doc.length) : 0;
      const diagnostics = error
        ? [{ from: at, to: Math.min(at + 1, editor.state.doc.length), severity: 'error' as const, message: error.message }]
        : [];
      editor.dispatch(lint.setDiagnostics(editor.state, diagnostics));
    },
    select: (from, to) => {
      const end = editor.state.doc.length;
      editor.dispatch({ selection: { anchor: Math.min(from, end), head: Math.min(to, end) }, scrollIntoView: true });
      editor.focus();
    },
    focus: () => {
      editor.focus();
    },
    destroy: () => {
      editor.destroy();
    },
  };
}
