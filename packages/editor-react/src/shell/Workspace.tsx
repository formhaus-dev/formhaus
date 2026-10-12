import { isPage } from '@formhaus/builder';
import { useRef } from 'react';
import { Canvas } from '../canvas/Canvas';
import { StepJump } from '../outline/StepJump';
import { StepOutline } from '../outline/StepOutline';
import { useForm } from '../store/hooks';
import { useEditorActions } from '../useEditorActions';
import { useWidth } from '../useWidth';
import styles from './EditorShell.module.css';

const OUTLINE = 960;

export function Workspace() {
  const actions = useEditorActions();
  const root = useRef<HTMLDivElement>(null);
  const width = useWidth(root);
  const stepped = useForm().blocks.filter(isPage).length > 1;
  return (
    <div ref={root} className={styles.workspace}>
      <div className={styles.layout} data-stepped={stepped || undefined}>
        {stepped && <div className={styles.outline}>{width >= OUTLINE ? <StepOutline /> : <StepJump />}</div>}
        <div className={styles.canvas}>
          <Canvas actions={actions} />
        </div>
      </div>
    </div>
  );
}
