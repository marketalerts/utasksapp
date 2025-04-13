import { children, createEffect, createMemo, createRenderEffect, createSignal, For, mergeProps, on, onCleanup, onMount, Show, untrack } from 'solid-js';
import type { ComponentProps, JSX, ParentComponent, Signal } from 'solid-js';
import { DateGrid, DateRow } from './date-grid';
import { isChromium, isMobile, isSafari } from '@solid-primitives/platform';
import { getNearestMonthStart, isSameMonth, isEqual, withOffset, getWeeksSinceUnix as getWeeksFromBase, isGreater, getNearestWeekStart, normalizeWeekDay } from './rules';
import { createArray, createVirtualArray, runLater } from '../utils';
import { useIntersectionDateSetter, useVirtualOffset } from './composables';
import { omit, once } from 'rambda';
import { get, set } from 'solid-utils/access';
import { Transition } from 'solid-transition-group';

export default function Datepicker(_props: {
  start: Signal<Date | null>;
  end?: Signal<Date | null>;
  model?: Signal<Signal<Date | null>>;
  displayDate?: Signal<Signal<Date | null>>;
  timezoneOffset?: number;
  weekStartDay?: number;
  today: Date;

  header: (ctx: {
    date: () => Date;
    selectPreviousMonth: VoidFunction;
    selectNextMonth: VoidFunction;
    onMonthClick: VoidFunction;
  }) => JSX.Element;

  weekNames: (week: Date[], WeekName: ParentComponent<{ day: Date }>) => JSX.Element;

  footer: (selectDate: (date?: Date | null) => void) => JSX.Element;

  onScroll?(displayedMonth: Date): void;

  bgColor: string;
}) {
  const props = mergeProps({
    model: createSignal(_props.start),
    displayDate: createSignal(_props.start),
    weekStartDay: 1,
  }, _props);

  const modelSignal = () => get(props.model);
  const model = () => get(modelSignal());

  const origin = model() ?? props.today;

  const [root, setRoot] = createSignal<HTMLDivElement>();
  const [rowElementHeight, setElementHeight] = createSignal(44);
  // const [rowYearHeight, setYearHeight] = createSignal(74.5);
  const [rowElementGap, setElementGap] = createSignal(-8);
  const [orbsMovable, setOrbsMovable] = createSignal(false);
  const [scrollLocked, setScrollLocked] = createSignal(false);

  // these were previously separate components,
  // but they proved too slow - almost exactly 10 times slower than just inlining classes in divs
  const rowClass = '= h-11 flex justify-between py-1';
  const cellClass = '= relative h-9 w-9 flex items-center justify-center cursor-pointer';

  const getWeeksSinceUnix = getWeeksFromBase(() => props.weekStartDay);

  const [displayDate, setDate] = createSignal(getNearestMonthStart(origin));
  const [renderOrigin, setRenderOrigin] = createSignal(getWeeksSinceUnix(displayDate()));

  const {
    refreshObserve,
    getDateCellElement,
    getDateElementPosition,
    reevaluateElementPositions,
  } = useIntersectionDateSetter(
    [displayDate, setDate],
    root,
    () => rowElementHeight() * 2.5,
    date => {
      if (scrollLocked()) return;

      renderDisplayDate(date);
    },
  );

  const weeks = useVirtualOffset(renderOrigin, rowElementHeight);

  onMount(() => {
    reevaluateElementPositions();
    forceScrollTo(model() ?? get(props.start) ?? get(props.end) ?? origin, { behavior: 'instant' });

    window.addEventListener('resize', reevaluateElementPositions);

    runLater(() => {
      setOrbsMovable(true);
    }, 200);
  });

  onCleanup(() => {
    window.removeEventListener('resize', reevaluateElementPositions);
  });

  createEffect(on(modelSignal, newModel => {
    const date = untrack(newModel[0]);

    if (!date) return;

    untrack(() => forceScrollTo(date));
  }, { defer: true }));

  createEffect(on(displayDate, (date) => {
    reevaluateElementPositions();
    props.onScroll?.(date);
  }, { defer: true }));

  const originWeek = createArray(7, i => withOffset(getNearestWeekStart(props.weekStartDay, origin), { days: i }));

  const weekNames = children(() => (
    props.weekNames(originWeek, p => (
      <div class={cellClass}
        onClick={(e) => (
          e.stopPropagation(),
          set(modelSignal(), old => (
            old && withOffset(old, {
              days: normalizeWeekDay(
                props.weekStartDay,
                p.day.getDay(),
              ) - normalizeWeekDay(
                props.weekStartDay,
                old.getDay(),
              ),
            })
          ))
        )}
      >
        <span class="c-app-text-tertiary app-text-body-m/regular inline-flex text-center capitalize">
          {p.children}
        </span>
      </div>
    ))
  ));

  const header = children(() => props.header({
    date: displayDate,
    selectNextMonth() {
      forceScrollTo(withOffset(displayDate(), { months: +1 }));
    },
    selectPreviousMonth() {
      forceScrollTo(withOffset(displayDate(), { months: -1 }));
    },
    onMonthClick() {
      // toggleMode();
    },
  }));

  const footer = children(() => props.footer(date => {
    selectDate(date ?? null, modelSignal());
  }));

  // const years = useVirtualOffset(() => origin.getFullYear(), () => rowYearHeight() / 4);

  // const mode = createSignal<'date' | 'year'>('date');

  // function toggleMode() {
  //   set(mode, (old) => {
  //     switch (old) {
  //       case 'date': return 'year';
  //       // case 'month': return 'year';
  //       case 'year': return 'date';
  //     }
  //   });
  // }

  return <>
    <div class="relative px-4 w-full flex flex-col items-center overflow-x-auto"
      style="overscroll-behavior: none"
      onClick={e => e.stopPropagation()}
    >
      {header()}

      <div class="relative w-full flex flex-col items-center overflow-hidden">
        <DateTable>
          <div class={rowClass + ' p-0! h-9!'}>
            {weekNames()}
          </div>
        </DateTable>

        <DateTable class="hide-scrollbar overflow-y-auto"
          classList={{
            'overflow-hidden!': !isMobile,
          }}
          style={{
            'scroll-snap-type': 'y mandatory',
            'scroll-margin-top': '2px',
            'max-height': rowElementHeight() * 6 + 2 + 'px',
            'margin-top': '-4px',
            'overscroll-behavior': 'none',
          }}
          ref={setRoot}

          onClick={e => e.stopPropagation()}
        >
          <div
            class={rowClass}
            style={{
              'padding-top': `${weeks.topMargin()}px`,
            }}
            ref={el => {
              createRenderEffect(() => {
                refreshObserve(el, withOffset(displayDate(), { months: -3 }));
              });
            }}
          />

          <DateGrid
            origin={origin}
            weekOffsets={weeks.offsets()}
            weekStartDay={props.weekStartDay}
          >{data => (
            <div class={rowClass}
              style={{
                'scroll-snap-align': data.containsMonthStart()
                  ? 'start'
                  : undefined,
                'scroll-snap-stop': 'always',
              }}
            >
              <DateRow {...data}>{cellDate => (
                <div class={cellClass}
                  data-date={cellDate.getDate()}
                  data-month={cellDate.getMonth()}
                  data-year={cellDate.getFullYear()}
                  ref={el => {
                    createRenderEffect(() => refreshObserve(el, cellDate));
                  }}
                  classList={{
                    'c-text-tertiary **:app-text-body-m/regular': !isSameMonth(cellDate, displayDate()),
                    'c-app-text-on-color! opacity-100!': isEqual(cellDate, get(props.start)) || isEqual(cellDate, get(props.end)),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    requestAnimationFrame(() => {
                      selectDate(cellDate, modelSignal());
                    });
                  }}
                > {/* a hack to make text properly-centered --------◤----------------◥ */}
                  <span class="= text-center app-text-body-m/medium list-item list-none">
                    {cellDate.getDate()}

                    <Show when={isEqual(cellDate, props.today)}>
                      <div class="absolute rounded-full app-transition-background h-[4px] w-[4px] bottom-[4px] left-[calc(50%_-_2px)]"
                        classList={{
                          'bg-app-icon-accented': !someModelEquals(cellDate),
                          'bg-app-text-on-color bottom-[5px]!': someModelEquals(cellDate),
                        }}
                      />
                    </Show>
                  </span>
                </div>
              )}</DateRow>
            </div>
          )}</DateGrid>

          <div class={rowClass}
            style={`padding-bottom: ${weeks.bottomMargin()}px`}
            ref={el => {
              createRenderEffect(() => {
                refreshObserve(el, withOffset(displayDate(), { months: +3 }));
              });
            }}
          />

          <DateSelection />
        </DateTable>
      </div>
    </div>

    {footer()}
  </>;

  function renderDisplayDate(dateOverride?: Date) {
    requestAnimationFrame(() => {
      // re-render list with the origin at currently displayed month start
      setRenderOrigin(getWeeksSinceUnix(setDate(dateOverride ?? displayDate())));
    });
  }

  function someModelEquals(cellDate: Date): boolean {
    return isEqual(cellDate, get(props.start)) || isEqual(cellDate, get(props.end));
  }

  function DateTable(props: ComponentProps<'div'>) {
    return <div {...props}
      class="= relative max-h-65 max-w-105 min-w-65 overflow-hidden grid grid-cols-1 px-1 mx--1 flex-grow w-full"
      classList={{
        [String(props.class)]: !!props.class,
        ...props.classList,
      }}
    >
      {props.children}
    </div>;
  }

  async function selectDate(date: Date | null, [, setTarget]: Signal<Date | null>) {
    try {
      if (!date) {
        return;
      }

      const start = getNearestMonthStart(date);

      if (isSameMonth(start, displayDate())) {
        return;
      }

      // if the date is beyond currently displayed-month
      await forceScrollTo(start);
    } finally {
      // set date only as the last step
      setTarget(date);
    }
  }

  function forceScrollTo(start: Date, opts?: ScrollIntoViewOptions) {
    if (!isSafari) {
      // force the grid to rerender
      setRenderOrigin(getWeeksSinceUnix(start));
    }

    // scroll to the date element
    if (isChromium) {
      scrollToDate(start, { ...opts, behavior: 'instant' });
    } else {
      scrollToDate(start, opts);
    }

    return runLater(() => {
      // scroll to the date element
      scrollToDate(start, opts);

      if (isChromium || isSafari) {
        return runLater(() => {
          renderDisplayDate(start);
        }, 100);
      }
    }, 10/*- a small delay to ensure some scrolling has already happened */);
  }

  function scrollToDate(date: Date, opts: ScrollToOptions = { behavior: 'smooth' }) {
    const dateEl = getDateCellElement(date);

    if (dateEl && dateEl.offsetTop) {
      return root()?.scrollTo({ top: dateEl.offsetTop, ...opts });
    }

    const [, cachedPosition] = getDateElementPosition(date);

    if (cachedPosition) {
      return root()?.scrollTo({ top: cachedPosition, ...opts });
    }

    const calculated = getWeeksSinceUnix(date) * rowElementHeight();

    root()?.scrollTo({ top: calculated, ...opts });
  }

  function DateSelection() {
    return <>
      <Show when={get(props.start)}>
        <DateSelectionOrb date={props.start[0]}
          enabled={orbsMovable()}
          halo={isEqual(get(props.start), get(props.end))}
          active={modelSignal() === props.start}
          ref={el => {
            createRenderEffect(() => refreshObserve(el, get(props.start)));
          }}
        />
      </Show>

      <Show when={get(props.end)}>
        <DateSelectionOrb date={props.end?.[0]}
          enabled={orbsMovable()}
          secondary
          halo={isEqual(get(props.start), get(props.end))}
          active={modelSignal() === props.end}
          ref={el => {
            createRenderEffect(() => refreshObserve(el, get(props.end)));
          }}
        />
      </Show>

      <Show when={get(props.start) && get(props.end) && !isEqual(get(props.start), get(props.end))}>
        <DateGradients
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          start={get(props.start)!}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          end={get(props.end)!}
        />
      </Show>
    </>;
  }

  function DateSelectionOrb(props: ComponentProps<'div'> & {
    date?: () => Date | null;
    secondary?: boolean;
    active?: boolean;
    halo?: boolean;
    enabled?: boolean;
  }) {
    const align = createMemo(() => {
      const date = props.date?.();

      if (!date) return undefined;

      if (isSameMonth(displayDate(), date) || isSameMonth(origin, date)) return undefined;

      if (date.getDate() < 15) return 'start';

      return 'end';
    });

    return <div {...omit(['date'], props)}
      class="absolute w-9 h-9 rounded-full z--1 bg-primary flex items-stretch justify-stretch"
      classList={{
        [String(props.class)]: !!props.class,
        ...props.classList,
        'z--2!': props.secondary,
        'app-transition-transform-200': props.enabled,
      }}
      style={{
        transform: processPosition(getDateElementPosition(props.date?.())),
        'scroll-snap-stop': 'always',
        'scroll-snap-align': align(),
      }}
      data-date={props.date?.()?.getDate()}
      data-month={props.date?.()?.getMonth()}
      data-year={props.date?.()?.getFullYear()}
    >
      <div class="flex-grow bg-app-icon-accented rounded-full app-transition-border,margin"
        classList={{
          'bg-app-icon-negative!': props.secondary,
          'opacity-50!': !props.active,
          'm-[-2px] b-solid b-[2px] border-app-icon-negative': props.secondary && props.halo,
          'b-solid b-[2px] b-secondary': !props.secondary && props.halo,
        }}
      />
    </div>;

    function processPosition(result: number[]) {
      return `translate3d(${result.map(x => x + 'px').join(', ')}, 0)`;
    }
  }

  function DateGradients(_props: {
    start: Date;
    end: Date;
  }) {
    const weeksToStart = () => getWeeksSinceUnix(getNearestWeekStart(props.weekStartDay, _props.start));
    const weeksToEnd = () => getWeeksSinceUnix(getNearestWeekStart(props.weekStartDay, _props.end));
    const isStartFirst = () => !isGreater(_props.start, _props.end);

    const weeksSpanAmount = createMemo(() => Math.abs(weeksToEnd() - weeksToStart()) + 1);
    const spanWeeks = createVirtualArray(() => Math.min(weeksSpanAmount(), 3), i => i);

    const startPosition = () => getDateElementPosition(isStartFirst() ? _props.start : _props.end);
    const endPosition = () => getDateElementPosition(isStartFirst() ? _props.end : _props.start);

    return <div>
      <For each={spanWeeks}>{(_, index) =>
        <DateGradientRow
          startPosition={startPosition()}
          endPosition={endPosition()}
          heightOverride={weeksSpanAmount() - 2}
          isFirst={index() === 0}
          isLast={index() === (spanWeeks.length - 1)}
          isStartFirst={isStartFirst()}
        />
    }</For>
    </div>;

    function DateGradientRow(gradient: {
      heightOverride?: number;
      startPosition: [x: number, y: number];
      endPosition: [x: number, y: number];
      isStartFirst: boolean;
      isFirst: boolean;
      isLast: boolean;
    }) {
      const bg = props.bgColor;
      const bgGradient = `linear-gradient(90deg, ${bg} 0%, transparent 10%, transparent 90%, ${bg} 100%)`;

      const getGradientString = () => {
        const accent = `color-mix(in srgb, var(--tg-theme-accent-text-color), transparent 80%)`;
        const negative = `color-mix(in srgb, var(--tg-theme-destructive-text-color), transparent 80%)`;

        const start = gradient.isFirst
          ? gradient.isStartFirst ? [accent, accent] : [negative, negative]
          : [accent, negative];

        const end = gradient.isLast
          ? !gradient.isStartFirst ? [accent, accent] : [negative, negative]
          : [accent, negative];

        const finalGradient = `linear-gradient(90deg, ${start[0]} 0%, ${end[0]} 100%),
              linear-gradient(90deg, ${start[1]} 0%, ${end[1]} 100%)`;

        return gradient.isFirst || gradient.isLast
            ? finalGradient
            : `repeating-linear-gradient(180deg,
                transparent 0px,
                transparent ${rowElementHeight() + rowElementGap()}px,
                ${bg} ${rowElementHeight() + rowElementGap()}px,
                ${bg} ${rowElementHeight()}px),
              ${finalGradient}`;
      };

      const heightOverride = () => (gradient.heightOverride ?? 1) * rowElementHeight();

      const heightOffset = () => !gradient.isFirst && !gradient.isLast
        ? heightOverride() + rowElementGap()
        : rowElementHeight() + rowElementGap();

      const topOffset = () => {
        if (gradient.isFirst) {
          return gradient.startPosition[1] || (gradient.endPosition[1] - heightOverride() - rowElementHeight());
        }

        if (gradient.isLast) {
          return gradient.endPosition[1] || (gradient.startPosition[1] + heightOverride() + rowElementHeight());
        }

        return gradient.startPosition[1]
          ? gradient.startPosition[1] + rowElementHeight()
          : gradient.endPosition[1] - heightOffset() + rowElementGap();
      };

      const leftOffset = createMemo(() => gradient.isFirst
        ? gradient.startPosition[0]
        : 0);

      const rightOffset = createMemo(() => gradient.isLast
        ? (root()?.clientWidth ?? 343) - gradient.endPosition[0] - rowElementHeight() - rowElementGap()
        : 0);

      return <div
        class="absolute bg-app-icon-negative opacity-50 z--3 overflow-hidden"
        style={{
          top: topOffset() + 'px',
          height: heightOffset() + 'px',
          left: leftOffset() + 'px',
          right: rightOffset() + 'px',
          background: getGradientString(),
        }}
        classList={{
          'rounded-l-full': gradient.isFirst,
          'rounded-r-full': gradient.isLast,
        }}
      >
        <div class="h-full absolute z-1"
          classList={{
            'rounded-l-full': gradient.isFirst,
            'rounded-r-full': gradient.isLast,
          }}
          style={{
            left: -leftOffset() + 'px',
            right: -rightOffset() + 'px',
            background: bgGradient,
          }}
        />
      </div>;
    }
  }
}
