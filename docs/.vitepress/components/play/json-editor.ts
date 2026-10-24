export interface Mark {
  from: number;
  to: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface JsonEditor {
  setDoc: (text: string) => void;
  setMarks: (marks: Mark[]) => void;
  select: (from: number, to: number) => void;
  destroy: () => void;
}

export async function mountJsonEditor(parent: HTMLElement, doc: string, onChange: (text: string) => void): Promise<JsonEditor> {
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
    { tag: tags.propertyName, color: 'var(--play-code-key)' },
    { tag: tags.string, color: 'var(--play-code-string)' },
    { tag: [tags.number, tags.bool, tags.null], color: 'var(--play-code-literal)' },
    { tag: [tags.punctuation, tags.separator, tags.brace, tags.squareBracket], color: 'var(--vp-c-text-3)' },
  ]);
  const theme = view.EditorView.theme({
    '&': { height: '100%', color: 'var(--vp-c-text-1)', backgroundColor: 'transparent', fontSize: 'var(--fh-site-font-size-xs)' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { fontFamily: 'var(--vp-font-family-mono)', lineHeight: '1.7' },
    '.cm-content': { padding: 'var(--fh-site-space-3) 0 var(--fh-site-space-16)', caretColor: 'var(--vp-c-text-1)' },
    '.cm-gutters': { border: 'none', color: 'var(--vp-c-text-3)', backgroundColor: 'transparent' },
    '.cm-lineNumbers .cm-gutterElement': { minWidth: 'var(--fh-site-space-10)', paddingInline: '0 var(--fh-site-space-2)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--vp-c-text-1)' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'var(--vp-c-brand-soft)',
    },
    '.cm-activeLine': { backgroundColor: 'var(--vp-c-default-soft)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--vp-c-text-1)' },
    '.cm-matchingBracket': { outline: '1px solid var(--vp-c-divider)', backgroundColor: 'transparent' },
    '.cm-tooltip': { border: '1px solid var(--vp-c-divider)', backgroundColor: 'var(--vp-c-bg-elv)', borderRadius: '8px' },
    '.cm-diagnostic': { fontFamily: 'var(--vp-font-family-base)', fontSize: 'var(--fh-site-font-size-xs)' },
  });
  let muted = false;
  const editor = new view.EditorView({
    parent,
    state: state.EditorState.create({
      doc,
      extensions: [
        view.lineNumbers(),
        view.highlightActiveLine(),
        view.highlightActiveLineGutter(),
        view.drawSelection(),
        view.EditorView.lineWrapping,
        commands.history(),
        language.bracketMatching(),
        language.indentOnInput(),
        language.foldGutter(),
        lang.json(),
        lint.lintGutter(),
        language.syntaxHighlighting(highlight),
        theme,
        view.EditorView.contentAttributes.of({ 'aria-label': 'Form definition JSON' }),
        view.keymap.of([commands.indentWithTab, ...commands.defaultKeymap, ...commands.historyKeymap]),
        view.EditorView.updateListener.of((update) => {
          if (update.docChanged && !muted) onChange(update.state.doc.toString());
        }),
      ],
    }),
  });
  return {
    setDoc: (text) => {
      if (text === editor.state.doc.toString()) return;
      muted = true;
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
      muted = false;
    },
    setMarks: (marks) => {
      const end = editor.state.doc.length;
      const diagnostics = marks.map((mark) => ({
        from: Math.min(mark.from, end),
        to: Math.min(Math.max(mark.to, mark.from + 1), end),
        severity: mark.severity,
        message: mark.message,
      }));
      editor.dispatch(lint.setDiagnostics(editor.state, diagnostics));
    },
    select: (from, to) => {
      const end = editor.state.doc.length;
      editor.dispatch({
        selection: { anchor: Math.min(from, end), head: Math.min(to, end) },
        effects: view.EditorView.scrollIntoView(Math.min(from, end), { y: 'center' }),
      });
      editor.focus();
    },
    destroy: () => editor.destroy(),
  };
}
