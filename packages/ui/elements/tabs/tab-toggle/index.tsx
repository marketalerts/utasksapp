import type { ComponentProps, JSX, ParentComponent, Signal } from 'solid-js';
import { createEffect, createSignal, Index } from 'solid-js';
import type { TabItem } from '..';

export default function TabToggle<T>(props: {
  tabs: TabItem<T>[];
  selected: Signal<T>;
}) {
  const [selectedIndex, setIndex] = createSignal(props.tabs.findIndex(t => t.value === props.selected[0]()));

  const tabWidth = () => 100 / props.tabs.length;

  createEffect(() => {
    setIndex(props.tabs.findIndex(t => t.value === props.selected[0]()));
  });

  return <>
    <div class="relative px-1 rounded-3 bg-app-secondary grid grid-rows-1 items-center w-full"
      style={{
        'grid-template-columns': props.tabs.map(() => '1fr').join(' '),
      }}
    >
      <Index each={props.tabs}>{(tab, index) => <>
        <div class="py-1 flex-grow">
          <button class="relative px-3 flex items-center justify-center min-h-[28px] w-full z-2"
            type="button"
            disabled={tab().disabled?.()}
            onClick={() => {
              props.selected[1](_ => tab().value);
              setIndex(index);
            }}
          >
            {tab().children(p => <span class="app-text-body-s/regular-long c-app-text-primary">{p.children}</span>)}
          </button>
        </div>
      </>}</Index>

      <div class="absolute top-0 z-1 h-full py-1 app-transition-transform"
        style={{
          width: tabWidth() + '%',
          transform: `translate3d(${selectedIndex() * 100}%, 0, 0)`,
        }}
      >
        <div class="bg-app-section h-full w-full rounded-2 100-app-transition-margin"
          classList={{
            'ml-1': selectedIndex() === 0,
            'ml--1': selectedIndex() === props.tabs.length - 1,
          }}
        />
      </div>
    </div>
  </>;
}

export function TabWrapper<T>(props: ComponentProps<'div'>) {
  return <div {...props}
    classList={{
      [String(props.class)]: !!props.class,
      ...props.classList,
    }}
    class="px-4 py-1 bg-app-section"
  >
    {props.children}
  </div>;
}