import WebApp from 'tma-dev-sdk';
import { Dynamic } from 'solid-js/web';
import { Show, children, useContext } from 'solid-js';
import type { ComponentProps, JSX, ParentProps } from 'solid-js';
import { omit } from 'rambda';
import { A } from '@solidjs/router';

import { ListContext } from './context';

import Arrow from 'i/Arrow.svg';

export interface ListItemProps extends ParentProps, ComponentProps<'li'> {
  href?: string;
  instantView?: boolean;
  rel?: string;
  right?: JSX.Element;
  rightHint?: string | JSX.Element;
  rightClass?: string;
  left?: JSX.Element;
  disabled?: boolean;
  simple?: boolean;
  semantic?: boolean;
  bottom?: JSX.Element;
}

function ListItem(props: ListItemProps) {
  const bottom = children(() => props.bottom);

  const list = useContext(ListContext) ?? {};

  const resepectSemantics = () => list.type !== 'div' && !props.semantic;

  return <Dynamic component={resepectSemantics() ? li : div}
    class="=list-item-container [&:last-child_.ut-item-border]:hidden [&_*]:app-text-body-l/regular overflow-hidden"
    classList={{
      'cursor-pointer': !props.disabled && (!!props.onClick || !!props.href),
      'cursor-not-allowed': props.disabled,
      [String(props.class)]: !!props.class,
      ...props.classList,
    }}
    {...omit(['children', 'right', 'href', 'rightHint', 'left', 'class', 'classList', 'bottom'], props)}
  >
    <div class="= relative flex w-full overflow-hidden gap-2">
      {/* <div class="h-10 w-10" /> */}
      <Show when={props.href && !props.disabled} fallback={<ItemContents />}>
        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
        <A href={props.href!} target={props.href?.includes('://') ? '_blank' : undefined}
          class="=list-item-link flex w-full h-full overflow-hidden gap-2"
          onClick={e => {
            if (props.instantView) {
              e.preventDefault();
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              WebApp.openLink(props.href!, { try_instant_view: true });
            }
          }}
        >
          <ItemContents />
        </A>
      </Show>
    </div>
    {bottom()}
  </Dynamic>;

  function ItemContents() {
    return <>
      <Show when={props.left}>
        <div class="=item-left-container flex items-center ltr:pl-4 ltr:pr-2 rtl:pr-4 rtl:pl-2">
          {props.left}
        </div>
      </Show>
      <div class="= relative flex items-center justify-between flex-grow max-w-full overflow-hidden gap-2">
        <div class="=item-children flex-grow min-h-11 flex items-center py-2 overflow-hidden"
          classList={{ '= ltr:pl-4 rtl:pr-4': !props.left, 'c-tg_hint': props.disabled }}
        >
          {props.children}
        </div>
        <div class="=item-right-container c-tg_hint flex flex-row-reverse items-center gap-2 ltr:pr-2 rtl:pl-2"
          classList={{
            [String(props.rightClass)]: !!props.rightClass,
          }}
        >
          <Show when={props.right}
            fallback={
              <Show when={!props.simple && !props.disabled}>
                <Arrow class="= ui-icon-tertiary overflow-unset rtl:rotate-180" />
              </Show>
            }
          >
            {props.right}
          </Show>
          {props.rightHint}
        </div>

        <Show when={!props.simple}>
          <div class="=item-border absolute bg-border-regular w-full h-[1px] z-2 bottom-0"/>
        </Show>
      </div>
    </>;
  }
}

function li(props: ComponentProps<'li'>) {
  return <li {...omit(['children'], props)}>{props.children}</li>;
}

function div(props: ComponentProps<'div'>) {
  return <div {...omit(['children'], props)}>{props.children}</div>;
}

function ListText(props: {
  title: string;
  subtitle?: string;
  titleProps?: ComponentProps<'p'>;
  subtitleProps?: ComponentProps<'p'>;
}) {
  return <Show when={props.subtitle}
    fallback={
      <p class="= m-0">
        {props.title}
      </p>
    }
  >
    <div class="= flex flex-col ltr:mr-3 rtl:ml-3">
      <p class="=list-item-title m-0" {...props.titleProps}>
        {props.title}
      </p>
      <p class="=list-item-subtitle m-0 mt-0.5 app-text-footnote! c-tg_hint" {...props.subtitleProps}>
        {props.subtitle}
      </p>
    </div>
  </Show>;
}

ListItem.Text = ListText;

export { ListItem, ListText };
