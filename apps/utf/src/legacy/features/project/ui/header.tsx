import { Dynamic } from 'solid-js/web';
import { Show } from 'solid-js';
import type { ComponentProps, JSX, ParentProps } from 'solid-js';
import { A } from '@solidjs/router';

interface HeaderProps extends ParentProps {
  id?: string;
  title: JSX.Element;
  subtitle?: string | JSX.Element;
  icon?: JSX.Element;
  href?: string;
  rightFallback?: JSX.Element;
}

const Div = (p: ComponentProps<'div'>) => <div {...p}>{p.children}</div>;

export default function ProjectHeader(props: HeaderProps) {
  return <header class="=project-header sticky flex flex-col bg-tg_bg min-h-11 top-0 px-4 z-10">
    <div class="= relative flex items-center justify-between py-1 min-h-11.5">
      <Dynamic component={props.href ? A : Div} href={props.href ?? ''}
        class="=project-icon inline-flex relative z-100"
      >
        {props.icon}
      </Dynamic>
      <div class="= flex-grow flex flex-col text-center overflow-hidden">
        <Dynamic component={props.href ? A : Div} href={props.href ?? ''}
          class="=project-title-link inline-flex justify-center overflow-hidden px-4 text-center"
        >
          <h1 class="=project-title app-text-body-emphasized m-0 whitespace-nowrap text-ellipsis overflow-hidden text-center">
            {props.title}
          </h1>
        </Dynamic>
        <Show when={props.subtitle}>
          <p class="=project-subtitle m-0 app-text-caption-one-regular c-tg_hint">{props.subtitle}</p>
        </Show>
      </div>
      {props.rightFallback}
    </div>
    {props.children}
  </header>;
}
