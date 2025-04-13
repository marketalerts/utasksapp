import { Context, createRenderEffect, getOwner, untrack } from 'solid-js';

export function provideContext<T>(context: Context<T>, value: T) {
  provide(context.id, value);
}

export function provide<T>(id: string | symbol, value: T) {
  const owner = getOwner();

  createRenderEffect(() => (untrack(() => {
    if (!owner) return;

    owner.context = {
      ...owner.context,
      [id]: value
    };
  })));
}

export function inject<T>(id: string | symbol): T | undefined {
  const owner = getOwner();

  return owner?.context[id];
}