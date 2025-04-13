import { Show } from 'solid-js';
import type { JSX, ParentProps } from 'solid-js';


interface HeaderProps extends ParentProps {
  id?: string;
  text: string;
  icon?: JSX.Element;
  right?: JSX.Element;
}

export default function ProjectHeader(props: HeaderProps) {
  return <header class="= sticky flex flex-col justify-center min-h-11 px-4 border-rounded-b-2 gap-2 z-10">
    <div class="= flex items-center justify-between">
      {props.icon}
      <div class="= flex-grow text-center overflow-hidden px-2">
        <h1 class="= app-text-body-emphasized m-auto text-nowrap text-ellipsis max-w-full overflow-hidden">
          {props.text}
        </h1>
      </div>
      <Show when={props.right} fallback={<div class="= min-w-8 min-h-8"></div>}>
        {props.right}
      </Show>
    </div>
    {props.children}
  </header>;
}
