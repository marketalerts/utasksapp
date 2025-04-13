import WebApp from 'tma-dev-sdk';
import { Suspense, createEffect, createResource, createSelector, createSignal, on } from 'solid-js';

import { getConfigArray } from 'shared/firebase';

import List from 'shared/ui/list';

import Checkmark from 'icons/Checkmark.svg';


export default function LanguagesList(props: {
  onSelect: (selectedLang: string | null) => unknown;
  selected: string | null;
  defaultLanguage: string;
}) {
  const [selectedLang, setLang] = createSignal(props.selected);

  createEffect(() => {
    WebApp.HapticFeedback.selectionChanged();
    setLang(props.selected);
  });

  const isSelected = createSelector(() => selectedLang() ?? props.defaultLanguage);

  const [languages] = createResource(() => getConfigArray<string>('locales'), { initialValue: ['en', 'ru', 'es', 'fa'] });

  const langs = () => languages.latest.map(lang => ({
    name: new Intl.DisplayNames(lang, { type: 'language' }).of(lang),
    value: lang,
  }));

  createEffect(on(selectedLang, selectedLang => {
    props.onSelect?.(selectedLang);
  }, { defer: true }));

  return <Suspense>
    <List each={langs()}>
      {({ name, value }) =>
        <List.Item onClick={() => setLang(value)}
          right={
            <Checkmark class="= fill-tg_button app-transition-width,opacity"
              classList={{ 'w-0 opacity-0': !isSelected(value), 'selected': isSelected(value) }}
            />
          }
        >
          <p class="=language-name m-0 capitalize whitespace-nowrap">
            {name}
          </p>
        </List.Item>
      }
    </List>
  </Suspense>;
}
