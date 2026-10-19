import { setOptionImage, type BuilderOption, type BuilderQuestion } from '@formhaus/builder';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button, IconButton, ImageDrop, Text } from '../ui';
import { useHost } from '../store/context';
import type { EditorActions } from '../useEditorActions';
import { IMAGE_TYPES, LINK_ERROR, checkImageFile, httpsLink, isEmbedded, summarize } from './imageSource';
import { ImageLink } from './ImageLink';
import styles from './OptionImage.module.css';

interface Props {
  field: BuilderQuestion;
  option: BuilderOption;
  name: string;
  actions: EditorActions;
  readOnly: boolean;
}

export function OptionImage({ field, option, name, actions, readOnly }: Props) {
  const host = useHost();
  const upload = readOnly ? undefined : host.uploadImage;
  const image = option.extra?.image ?? '';
  const [linking, setLinking] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const errorId = useId();

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const commit = (value: string) => {
    actions.edit((form) => {
      setOptionImage(form, field.uid, option.uid, value);
    });
  };

  const closeLink = () => {
    setLinking(false);
    setDraft('');
    setError(null);
  };

  async function send(file: File) {
    if (!upload || busy) return;
    const problem = checkImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { url } = await upload(file);
      commit(url);
      if (alive.current) closeLink();
    } catch (failure) {
      if (alive.current) setError(host.describeError(failure));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  const openLink = () => {
    setDraft(image && !isEmbedded(image) ? image : '');
    setError(null);
    setLinking(true);
  };

  const applyLink = (value: string) => {
    if (!value.trim()) {
      if (!upload && !linking && image) commit('');
      closeLink();
      return;
    }
    const link = httpsLink(value);
    if (!link) {
      setError(LINK_ERROR);
      return;
    }
    commit(link);
    closeLink();
  };

  const onText = (text: string) => {
    const link = httpsLink(text);
    if (link) {
      commit(link);
      closeLink();
      return;
    }
    if (!isEmbedded(text)) {
      setLinking(true);
      setDraft(text);
    }
    setError(LINK_ERROR);
  };

  const summary = image ? summarize(image, host.isUploadedImage?.(image) ?? false) : null;
  let body: ReactNode;
  if (!readOnly && !busy && (linking || (!upload && !image))) {
    body = (
      <>
        <ImageLink
          name={name}
          value={draft}
          errorId={error ? errorId : undefined}
          autoFocus={linking}
          root={root}
          onChange={(value) => {
            setDraft(value);
            setError(null);
          }}
          onError={setError}
          onCommit={() => {
            applyLink(draft);
          }}
          onCancel={linking && (upload || image) ? closeLink : undefined}
        />
        {linking && (upload || image) && <IconButton label="Cancel" icon={<X aria-hidden />} onClick={closeLink} />}
      </>
    );
  } else if (busy) {
    body = (
      <Text size="sm" tone="muted" role="status">
        Uploading…
      </Text>
    );
  } else if (summary) {
    body = (
      <div className={styles.summary}>
        <Text size="sm" truncate>
          {summary.title}
        </Text>
        {summary.detail && (
          <Text size="xs" tone="muted" truncate>
            {summary.detail}
          </Text>
        )}
      </div>
    );
  } else {
    body = (
      <Text size="sm" tone="muted" truncate>
        {readOnly ? 'No image' : 'Drop or paste an image'}
      </Text>
    );
  }

  const idle = !readOnly && !busy && !linking;
  const embedded = isEmbedded(image);
  const buttons = [
    idle && upload && !image && (
      <Button key="link" variant="ghost" aria-label={`Use a link for ${name}`} onClick={openLink}>
        Use a link
      </Button>
    ),
    idle && !upload && image && (
      <Button key="edit" aria-label={`${embedded ? 'Replace' : 'Edit'} image link for ${name}`} onClick={openLink}>
        {embedded ? 'Replace' : 'Edit link'}
      </Button>
    ),
    idle && image && (
      <Button
        key="remove"
        variant="ghost"
        aria-label={`Remove image for ${name}`}
        onClick={() => {
          setError(null);
          commit('');
        }}
      >
        Remove
      </Button>
    ),
  ].filter(Boolean);

  return (
    <div ref={root} className={styles.root}>
      <ImageDrop
        src={busy ? '' : image}
        label={`Image for ${name}`}
        accept={IMAGE_TYPES}
        busy={busy}
        disabled={readOnly}
        {...(upload ? { onFile: (file: File) => void send(file) } : {})}
        {...(idle && upload
          ? { upload: { text: image ? 'Replace' : 'Upload', label: `${image ? 'Replace' : 'Upload'} image for ${name}` } }
          : {})}
        onText={onText}
        actions={buttons.length > 0 ? buttons : undefined}
        footer={
          error && (
            <Text as="p" size="sm" tone="danger" id={errorId} role="alert" className={styles.error}>
              {error}
            </Text>
          )
        }
      >
        {body}
      </ImageDrop>
    </div>
  );
}
