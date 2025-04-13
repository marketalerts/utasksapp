import { createContext, getOwner, onMount, useContext } from 'solid-js';

import { provideContext } from 'solid-utils/context';

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      waterfall: true | Waterfall;
    }
  }
}

export interface DelayOptions {
  delay?: number;
  delayDelta?: number;
}

class Waterfall {
  private generator;

  public enabled: boolean = true;

  constructor(public className: string, delayOptions: Required<DelayOptions>) {
    this.generator = Waterfall.createDelayGenerator(delayOptions);
  }

  getNextDelay(): number {
    return this.generator.next().value ?? 0;
  }

  static *createDelayGenerator(delayOptions: Required<DelayOptions>) {
    let hyperbolicDelay = delayOptions.delay;
    let cumullativeDelay = 0;

    yield 0;

    while (hyperbolicDelay >= 0) {
      hyperbolicDelay = hyperbolicDelay - delayOptions.delayDelta;

      const finalDelay = cumullativeDelay += hyperbolicDelay;

      yield finalDelay;
    }

    yield 0;
  }

  cleanups: [VoidFunction, number][] = [];
}

const WaterfallContext = createContext<Waterfall>();

/**
 * Allows to generate appearance animations for any number of elements on the page
 *
 * And:
 * - add the `` directive into every native element's props that you want to waterfall
 * - call `useElementWaterfall` in the root component - a waterfall-origin point
 *
 * @param className the class name that applies an animation, for example `animate-init-fade-in`
 * @param options options
 *
 * The algorithm implements a sqaure-root delay function via hyperbolic delay-delta accumulation,
 * by subtracting the delay-delta from the next element's delay,
 * which gives an exponential increase in element appearance speed.
 *
 * For example, with the default parameters of `{ delay = 50, delayDelta = 2, lowerLimit = 10 }`,
 * the elemets will appear with the following delays:
 * ```
 * #0: 48ms
 * #1: 94ms (#0 + ~100%)
 * #2: 138ms (#1 + ~46%)
 * #3: 180ms (#2 + ~30%)
 * #4: 220ms (#3 + ~22%)
 * #5: 258ms (#4 + ~17%)
 * ...etc
 * ```
 * giving a decreasing increase in appearance speed
 * to reduce user waiting time for pages with lots of elements.
 * The more elements on the page, the more dramatic the effect is.
 *
 * Setting the delay-delta to `0` will make the appearance delays linear.
 *
 * The lower-limit simply prevents the delay-delta from decreasing lower than this.
 * @returns
 */
export function useElementWaterfall(className: string, options: DelayOptions = {}) {
  const { delay = 50, delayDelta = 2 } = options;

  const value = new Waterfall(className, { delay, delayDelta });

  provideContext(WaterfallContext, value);

  onMount(() => {
    setTimeout(() => {
      value.enabled = false;
      value.cleanups.forEach((el) => el[0]());
    }, value.cleanups.reduce((sum, el) => sum + el[1], 0));
  });
}

export function waterfall(el: HTMLElement) {
  const root = useContext(WaterfallContext);

  if (!root || !root.enabled) return;

  const finalDelay = root.getNextDelay();

  el.classList.add(root.className);

  if (finalDelay) {
    el.style.animationDelay = `${finalDelay}ms`;
  }

  root.cleanups.push([() => {
    el.classList.remove(root.className);
    el.style.animationDelay = '';
  }, finalDelay]);
}
