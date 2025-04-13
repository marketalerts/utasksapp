import { createResource } from 'solid-js';

export const createConfigResource = <T>(
  variable: string,
  defaultValue: T,
  processRaw: ((def: T) => (rawJSONValue?: string) => T) = d => v => {
    try {
      if (typeof v === 'undefined') {
        return d;
      }

      return JSON.parse(v);
    } catch (error) {
      return d;
    }
  },
) => createResource(
  () => defaultValue,
  { initialValue: defaultValue },
);
