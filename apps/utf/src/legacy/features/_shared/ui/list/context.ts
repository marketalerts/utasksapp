import { createContext } from 'solid-js';

export const ListContext = createContext({
  type: 'ul' as 'ul' | 'ol' | 'div',
});
