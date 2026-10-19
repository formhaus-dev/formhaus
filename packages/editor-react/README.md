# @formhaus/editor-react

The visual form editor. A host object connects it to storage, publishing and notices.

```tsx
import { EditorRoot, createMemoryHost } from '@formhaus/editor-react';

const host = createMemoryHost({ Preview, onChange: save });

<EditorRoot host={host} />;
```

## Host capabilities

Optional members turn on extra editor features.

| Member | Effect |
| --- | --- |
| `publish(revision, overwrite)` | Shows the Publish button. |
| `features.country` | Offers the visitor country as a hidden field source. |
| `uploadImage(file)` | Lets authors upload option images. |
| `isUploadedImage(url)` | Labels a stored image as "Uploaded image" instead of its link. |

### Option images

Without `uploadImage`, option images take an `https:` link only. The editor rejects `data:` URIs and other schemes, and shows an existing `data:` image as "Embedded image" with Replace and Remove.

With `uploadImage`, the image well takes a picked, dropped or pasted file. The editor accepts PNG, JPEG, WebP and GIF up to 5 MB, then calls the host:

```ts
const host = createMemoryHost({
  Preview,
  uploadImage: async (file) => {
    const res = await fetch('/assets', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    if (!res.ok) throw new Error('Upload failed');
    return { url: ((await res.json()) as { url: string }).url };
  },
  isUploadedImage: (url) => url.startsWith('https://assets.example.com/'),
});
```

Return an `https:` URL that every respondent can load. A rejected promise shows `describeError(error)` under the option. Check the file again on the server: the editor checks only type and size.
