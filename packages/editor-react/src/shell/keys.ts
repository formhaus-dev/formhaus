const apple = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export const keyHint = (key: string, shift = false) => (apple() ? `${shift ? '⇧' : ''}⌘${key}` : `Ctrl+${shift ? 'Shift+' : ''}${key}`);

export const undoHint = () => keyHint('Z');
export const redoHint = () => keyHint('Z', true);
