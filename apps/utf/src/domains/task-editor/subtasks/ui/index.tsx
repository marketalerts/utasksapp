import { TransitionGroup } from 'solid-transition-group';
import { createStore, produce } from 'solid-js/store';
import type { SetStoreFunction } from 'solid-js/store';
import { For } from 'solid-js';

import { SubtaskList, SubtaskItem } from '#/task-editor/subtasks/features';
import type { Subtask } from '#/task-editor/subtasks/definitions';

import Item from './item';

export default function Subtasks(props: {
  list: readonly Subtask[];
  updateList?: SetStoreFunction<Subtask[]>;
}) {
  const [inputs, setInputs] = createStore<Record<number, HTMLTextAreaElement>>({});

  const subtasks = new SubtaskList({
    get: () => props.list,
    set(updater) { props.updateList?.(produce(updater)); },
  });

  class SubtaskInputItem extends SubtaskItem {
    getInput(offset: number): HTMLTextAreaElement | undefined {
      return inputs[this.index() + offset];
    }
  }

  return <div data-id="subtask-list">
    <TransitionGroup
      enterActiveClass="animate-init-fade-in-down-100"
      exitActiveClass="animate-init-fade-out-up-100"
    >
      <For each={props.list}>{(item, index) =>
        <Item value={() => item} index={index} ref={el => setInputs(produce(els => els[index()] = el))}
          controller={new SubtaskInputItem(subtasks, index)}
          readonly={!props.updateList}
        />
      }</For>
    </TransitionGroup>
  </div>;
}
