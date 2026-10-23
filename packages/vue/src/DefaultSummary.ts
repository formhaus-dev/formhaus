import { h, type FunctionalComponent } from 'vue';
import type { ErrorSummaryComponentProps } from './types';

export const DefaultSummary: FunctionalComponent<ErrorSummaryComponentProps> = ({ rootProps, title, groups, showField }) =>
  h('div', { class: 'fh-error-summary', ...rootProps }, [
    h('strong', { class: 'fh-error-summary__title' }, title),
    ...groups.flatMap((group) => [
      groups.length > 1 ? h('p', { class: 'fh-error-summary__step' }, group.title) : null,
      h(
        'ul',
        { class: 'fh-error-summary__list' },
        group.entries.map((entry) =>
          h('li', { key: entry.key }, [
            h(
              'a',
              {
                class: 'fh-error-summary__link',
                href: `#${entry.id}`,
                onClick: (event: Event) => {
                  event.preventDefault();
                  showField(entry.key);
                },
              },
              entry.text,
            ),
          ]),
        ),
      ),
    ]),
  ]);
