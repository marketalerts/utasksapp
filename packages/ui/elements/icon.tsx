import { children, onMount } from 'solid-js';
import type { ParentProps } from 'solid-js';

let sequenceId = 0;

export function IconFix(props: ParentProps) {
  const resolved = children(() => props.children);
  onMount(() => requestAnimationFrame(() => {
    const svg = resolved() as SVGElement;

    const fills = svg.querySelectorAll('[fill^="url(#"]');
    const ids = [...fills]
      .map(f => ({
        el: f,
        id: f.getAttribute('fill')?.replace(/^url\(#(.*?)\)$/, '$1'),
      }))
      .filter(x => !!x.id);

    for (const { el, id } of ids) {
      const target = svg.querySelector(`[id="${id}"]`);

      if (!target) continue;

      // patch ids sequentially
      const newId = id + '_' + sequenceId++;
      el.setAttribute('fill', `url(#${newId})`);
      target.setAttribute('id', newId);
    }
  }));

  return <>{resolved()}</>;
}