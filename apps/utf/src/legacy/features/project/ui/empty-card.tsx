import { t } from 'locales/project';

import { getCssVariable } from 'shared/ui/telegram';

export default function EmptyListCard(props: { hide?: boolean; group?: boolean }) {
  const clickOnCreateButton = () => {
    const createButton = document.getElementById('create-task');

    createButton?.click();
  };

  const colorScheme = () => getCssVariable('--tg-color-scheme', 'color-scheme') as 'light' | 'dark';

  return <div class="= flex-col gap-2 items-center justify-between p-7 pb-20 cursor-pointer"
    style={{ display: props.hide ? 'none' : 'flex' }}
    onClick={clickOnCreateButton}
  >
    <img src={`${import.meta.env.BASE_URL}${import.meta.env.APP_BASE}empty-project-${(props.group ? 'group-' : '') + colorScheme()}.png`}
      alt={t('empty-list title')}
      class="= w-64 h-64 max-w-64 max-h-64"
    />
    <p class="= app-text-body-emphasized m-0 text-center">{t('empty-list title')}</p>
    <p class="= app-text-footnote m-0 text-center">{t('empty-list desc')}</p>
  </div>;
}
