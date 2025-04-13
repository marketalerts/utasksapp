export interface SubtaskListController {
  updateItemText(value: string, index: number): void;
  updateItemState(value: boolean, index: number): void;
  removeItem(index: number): void;
  addItem(index: number): void;
  length: number;
}

export interface SubtaskItemController {
  updateText(val: string): void;
  updateState(state: boolean): void;
  select(offset: number): void;
  add(insert?: boolean): void;
  remove(): void;
}

export class Subtask {
  constructor(
    public title = '',
    public done = false,
  ) {}
}

export interface SubtaskCollection {
  get: () => readonly Subtask[];
  set(updater: (list: Subtask[]) => void): void;
}
