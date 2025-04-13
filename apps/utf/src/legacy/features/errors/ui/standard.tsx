import WebApp from 'tma-dev-sdk';
import { Show, mergeProps, onMount } from 'solid-js';
import type { JSX } from 'solid-js';
import { useNavigate } from '@solidjs/router';

import { ErrorType } from '../types';

import StandardErrorTemplate from './standard-template';

import { t as tProfile } from 'locales/profile';
import { t } from 'locales/errors';

import { MainButton } from 'shared/ui/telegram';

export default function StandardError(_props: ({
  code: string;
  type: ErrorType.HTTP;
} | {
  code?: string;
  type: ErrorType;
}) & {
  actions?: JSX.Element[];
  error?: () => any;
  retry?: VoidFunction;
}) {
  const props = mergeProps({ error: () => history.state }, _props);

  onMount(() => WebApp.HapticFeedback.notificationOccurred('error'));

  const navigate = useNavigate();

  const SupportButton = (
    <a href="https://t.me/UTasks_Support"
      class="=error-support-link c-tg_link underline w-full bg-transparent text-center"
    >
      {tProfile('support title')}
    </a>
  );

  const Retry = () => <>
    <Show when={props.retry} fallback={
      <MainButton onClick={() => navigate('/')} text={t('home-button text')} />
    }>
      <MainButton onClick={() => {
        try {
          props.retry?.();
        } catch {
          navigate('/');
        }
      }} text={t('retry-button text')} />
    </Show>
  </>;

  return <>
    <Show when={props.type === ErrorType.HTTP && props.code}
      fallback={
        <StandardErrorTemplate error={props.error()}
          title={t('standard-error title', { key: '500' })}
          subtitle={t('standard-error description', { key: '500' })}
          actions={[
            ...props.actions ?? [],

            SupportButton,

            <Retry />,
          ]}
        />
      }
    >
      <HTTPError code={String(props.code)} />
    </Show>
  </>;

  function HTTPError(_props: { code?: string | number; }) {
    return <StandardErrorTemplate error={_props.code == '403' ? undefined : props.error()}
      img={scheme => _props.code == '403' ? `restricted-${scheme}.png` : undefined}
      title={t('standard-error title', String(_props.code))}
      subtitle={t('standard-error description', String(_props.code))}
      actions={[
        ...props.actions ?? [],

        SupportButton,

        <MainButton onClick={() => navigate('/')} text={t('home-button text')} />,
      ]} />;
  }
}
