import type { EditorView } from '@codemirror/view';

export interface JsonEditorHandle {
  text(): string;
  focused(): boolean;
  setDoc(text: string): void;
  format(): boolean;
  destroy(): void;
}

export interface JsonEditorOptions {
  doc: string;
  onChange(text: string): void;
  onBlur(): void;
  format(text: string): string | undefined;
}

export async function mountJsonEditor(parent: HTMLElement, options: JsonEditorOptions): Promise<JsonEditorHandle> {
  const [view, state, lang, language, commands, lezer] = await Promise.all([
    import('@codemirror/view'),
    import('@codemirror/state'),
    import('@codemirror/lang-json'),
    import('@codemirror/language'),
    import('@codemirror/commands'),
    import('@lezer/highlight'),
  ]);
  const { tags } = lezer;
  const highlight = language.HighlightStyle.define([
    { tag: tags.propertyName, color: 'var(--json-key)' },
    { tag: tags.string, color: 'var(--json-string)' },
    { tag: tags.number, color: 'var(--json-number)' },
    { tag: [tags.bool, tags.null], color: 'var(--json-bool)' },
    { tag: [tags.punctuation, tags.separator, tags.brace, tags.squareBracket], color: 'var(--json-punct)' },
  ]);
  const theme = view.EditorView.theme({
    '&': { height: '100%', color: 'var(--vp-c-text-1)', backgroundColor: 'transparent', fontSize: '13px' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: 'var(--vp-font-family-mono)', lineHeight: '1.6', overscrollBehavior: 'contain' },
    '.cm-content': { padding: '12px 0 24px', caretColor: 'var(--vp-c-brand-1)' },
    '.cm-line': { padding: '0 16px 0 8px' },
    '.cm-gutters': { border: 'none', color: 'var(--vp-code-line-number-color)', backgroundColor: 'transparent' },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: '44px', padding: '0 10px 0 16px' },
    '.cm-activeLine': { backgroundColor: 'var(--vp-code-line-highlight-color)' },
    '.cm-activeLineGutter': { color: 'var(--vp-c-text-2)', backgroundColor: 'var(--vp-code-line-highlight-color)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--vp-c-brand-1)' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'var(--vp-c-brand-soft)' },
    '.cm-matchingBracket': { outline: '1px solid var(--vp-c-brand-2)', backgroundColor: 'transparent' },
  });
  let muted = false;
  const replace = (editor: EditorView, insert: string) => {
    muted = true;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert } });
    muted = false;
  };
  const run = (editor: EditorView) => {
    const next = options.format(editor.state.doc.toString());
    if (next === undefined) return false;
    replace(editor, next);
    return true;
  };
  const editor = new view.EditorView({
    parent,
    state: state.EditorState.create({
      doc: options.doc,
      extensions: [
        view.lineNumbers(),
        view.highlightActiveLine(),
        view.highlightActiveLineGutter(),
        view.drawSelection(),
        commands.history(),
        language.bracketMatching(),
        language.indentOnInput(),
        lang.json(),
        language.syntaxHighlighting(highlight),
        theme,
        view.keymap.of([{ key: 'Shift-Alt-f', run }, commands.indentWithTab, ...commands.defaultKeymap, ...commands.historyKeymap]),
        view.EditorView.updateListener.of((update) => {
          if (update.docChanged && !muted) options.onChange(update.state.doc.toString());
          if (update.focusChanged && !update.view.hasFocus) options.onBlur();
        }),
      ],
    }),
  });
  return {
    text: () => editor.state.doc.toString(),
    focused: () => editor.hasFocus,
    setDoc: (text) => { if (text !== editor.state.doc.toString()) replace(editor, text); },
    format: () => run(editor),
    destroy: () => editor.destroy(),
  };
}
