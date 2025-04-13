import { children, createMemo } from 'solid-js';
import type { Accessor, ComponentProps, JSX, Signal } from 'solid-js';

import Checkbox from 'shared/ui/checkbox';

export const checkRegexp = /^(\[(?: |u|x)\]\s)(.+)$/;

export function ChecklistMatch(props: {
  match: string;
  onToggle: () => void;
  children?: (text: string) => JSX.Element;
  isChecked: boolean;
  disabled?: boolean;
  class?: string;
}) {
  const [,, text] = props.match.match(new RegExp(checkRegexp.source)) ?? [];

  const resolved = children(() => (
    props.children?.(text) ?? text
  ));

  return <>
    <Checkbox class="=checklist-checkbox inline absolute! z-10 bg-section scale-80 left--0.5 mt-[1px] pointer-events-auto!" checked={props.isChecked}
      onClick={props.onToggle}
      disabled={props.disabled}
      checkClass={props.class}
    />
    <div class="= inline-block w-5 h-4"/>
    {resolved()}
  </>;
}

type Matcher = (match: () => string) => JSX.Element;

type Checks = Accessor<{
  match: string;
  index: number;
}[]>;

export function useChecklistMarker(options: {
  props: Partial<ComponentProps<typeof ChecklistMatch>>;
  dependencies?: () => void;
}): readonly [Matcher];

export function useChecklistMarker(options: {
  textTemplate: Signal<string>;
  props: Partial<ComponentProps<typeof ChecklistMatch>>;
  dependencies?: () => void;
}): readonly [Matcher, Checks, () => void];

export function useChecklistMarker(options: {
  textTemplate?: Signal<string>;
  props: Partial<ComponentProps<typeof ChecklistMatch>>;
  dependencies?: () => void;
}): readonly [Matcher, Checks, () => void] | readonly [Matcher] {
  let matchedChecks = 0;

  const checkRegexpMultiline = new RegExp(checkRegexp.source, 'gmi');

  const checks = options.textTemplate && createMemo(() => (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [...options.textTemplate![0]().matchAll(checkRegexpMultiline)]
      .map(match => ({
        match: match[1],
        index: match.index,
      }))
  ));

  function dependencies() {
    matchedChecks = 0;
  }

  function markChecklist(match: () => string) {
    const current = checks?.()[matchedChecks++];
    const isChecked = current?.match.includes('x') ?? match().includes('[x]');
    const newCheck = isChecked ? ' ' : 'x';
    const toggle = () => options.textTemplate?.[1](old => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return old.substring(0, current!.index + 1) + newCheck + old.substring(current!.index + 2);
    });

    return <ChecklistMatch match={match()}
      onToggle={toggle}
      isChecked={isChecked}
      {...options.props}
    />;
  }

  return options.textTemplate
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ? [markChecklist, checks!, dependencies] as const
    : [markChecklist];
}
