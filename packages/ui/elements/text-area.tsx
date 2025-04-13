import { model, useDirectives } from 'solid-utils/model';
import { get, set } from 'solid-utils/access';
import type { Component, JSX, ParentProps } from 'solid-js';
import { children, createMemo, createRenderEffect, createSignal, mergeProps, on, onMount, Show } from 'solid-js';
import type { ComponentProps, Signal } from 'solid-js';
import { max, omit, once, prop } from 'rambda';

/**
 * Like the native text-area, but auto-resizes to text contents
 *
 * Has a plain div container, where `class` and `classList` attributes will apply;
 *
 * Other attributes go straight to native text-area
 *
 * If `renderInput` is set, `children` is ignored.
 * `children` allows for custom text overlay rendering, which is obsolete when rendering a custom input
 */
export default function TextArea(_props: Omit<ComponentProps<'textarea'>, 'children'> & {
  model?: Signal<string>;
  children?: (text: string) => (JSX.Element);

  focused?: Signal<boolean>;
  maxLines?: number | undefined;
  more?: Component<{
    onClick: ComponentProps<'button'>['onClick']
  }>;
}) {
  let wrapperRef!: HTMLDivElement;
  let overlayRef!: HTMLSpanElement;
  const inputRef = createSignal<HTMLTextAreaElement>();
  const props = mergeProps({
    model: createSignal(''),
  }, _props);

  useDirectives(model);

  const showMoreOverride = createSignal(false);
  const wasEdited = createSignal(false);
  const isFocused = props.focused ?? createSignal(false);
  /* the space prevents span not accounting for full line-height at empty trailing lines */
  const overlayText = () => get(props.model) + ' \n';
  const isOverlayShown = () => !get(isFocused) && !!props.children;

  const resolved = children(() => props.children?.(overlayText()) || overlayText());

  const inputProps = createMemo(() => ({
    class: 'absolute w-full h-full overflow-hidden resize-none p-0 z-1 opacity-100',
    classList: {
      'pb-1': get(props.model).endsWith('\n'),
      'app-transition-opacity-100 opacity-0!': isOverlayShown() && !!get(props.model),
    },

    onFocus: props.children ? onFocus : undefined,
    onFocusIn: props.children ? onFocus : undefined,
    onFocusOut: props.children ? onBlur : undefined,
    onBlur: props.children ? onBlur : undefined,
  }));

  onMount(() => {
    set(showMoreOverride, true);
  });

  createRenderEffect(() => {
    if (get(isFocused)) {
      set(wasEdited, true);
    }
  });

  const maxHeight = () => getHeightOfLines(props.maxLines);

  const textAreaObserver = new ResizeObserver(([el]) => {
    if (!el) {
      return;
    }

    if (el.target.scrollHeight <= el.target.clientHeight) {
      set(showMoreOverride, false);

      if (get(isFocused)) {
        setTimeout(() => {
          wrapperRef?.classList.remove('app-transition-max-height,height');
        }, 200);
      }
    }
  });

  return <>
    <div class="max-w-full relative app-transition-max-height,height"
      ref={wrapperRef}
      classList={{
        [String(props.class)]: !!props.class,
        ...props.classList,
        'overflow-hidden': !!maxHeight(),
      }}
      style={{
        ...typeof props.style === 'string' ? {} : props.style,
        'max-height': maxHeight(),
      }}
    >
      <textarea use:model={props.model}
        ref={el => {
          set(inputRef, el);
          typeof props.ref === 'function'
            ? props.ref(el)
            : props.ref = el;

          textAreaObserver.disconnect();
          textAreaObserver.observe(el);
        }}
        {...inputProps}
        {...omit(['class', 'classList', 'model', 'maxLines', 'children', 'ref', 'focused', 'more'], props)}

        style={{
          'max-height': maxHeight(),
        }}
      />

      <HackOverlay isShown={isOverlayShown()} ref={overlayRef}>
        {resolved()}
      </HackOverlay>

      <Show when={isMoreButtonShown()}>
        {props.more?.({ onClick: () => {
          set(wasEdited, true);
        } })}
      </Show>
    </div>
  </>;

  function isMoreButtonShown() {
    return props.more
      && props.maxLines
      && !get(wasEdited)
      && maxHeight();
  }

  function onFocus() {
    if (!props.children) return;

    set(isFocused, true);
  }

  function onBlur() {
    if (!props.children) return;

    set(isFocused, false);
  }

  function getHeightOfLines(lines?: number) {
    if (!lines) {
      return undefined;
    }

    get(wasEdited);
    get(props.model);

    const ta = get(inputRef);

    if (!ta || !overlayRef) return undefined;

    if (get(wasEdited)) {
      return ta.scrollHeight + 'px';
    }

    if (!lines || !get(showMoreOverride)) {
      return undefined;
    }

    const lineHeight = (ta.computedStyleMap?.().get('line-height') ?? getComputedStyle(ta).lineHeight)?.toString();

    if (!lineHeight) {
      return undefined;
    }

    const lineX = Number(lineHeight.replace(/(px|r?em)$/, ''));
    const linePixels = lineHeight.endsWith('px') ? lineX : (lineX * 16);

    return `${linePixels * lines}px`;
  }
}

export function HackOverlay(props: ParentProps<{ isShown: boolean; }> & ComponentProps<'span'>) {
  return <span // hack-element to make the text-area auto-resize itself
    {...props}
    class="relative resize-none p-0 whitespace-pre-wrap pointer-events-none z-2 opacity-100"
    aria-hidden={!props.isShown}
    classList={{
      'opacity-0! app-transition-opacity **:pointer-events-none!': !props.isShown,
      [String(props.class)]: !!props.class,
      ...props.classList,
    }}
    style={props.style}
  >
    {props.children}
  </span>;
}