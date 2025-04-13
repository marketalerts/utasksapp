import type { Accessor, ComponentProps } from 'solid-js';
import { omit } from 'rambda';

import Arrow from 'i/Arrow.svg';

export default function ListArrow(props: ComponentProps<'svg'> & { isOpen?: Accessor<boolean> }) {
  return <Arrow class="=list-arrow app-transition-transform ui-icon-tertiary rtl:scale-x--100"
    classList={{ 'rotate-90': props.isOpen?.(), [String(props.class)]: !!props.class }}
    {...omit(['isOpen', 'class'], props)}
  />;
}
