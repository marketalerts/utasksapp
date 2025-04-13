import { transformerCompileClass, transformerVariantGroup } from 'unocss';
import type { SourceCodeTransformer } from 'unocss';

const classTransformTrigger = /(["'`])=(?<name>[^"'`\s]+)?\s((?:[^"'`]|\n)*?)\1/gm;

export default [
  transformerCompileClass({
    classPrefix: 'ut-',
    trigger: classTransformTrigger,
  }),
  transformerVariantGroup(),
] satisfies SourceCodeTransformer[];

// TODO: delete?
function transformerRemoveClass(options: { trigger: RegExp }): SourceCodeTransformer {
  return {
    name: 'class-compile-identifier-remover',
    transform(code) {
      const matches = [...code.original.matchAll(options.trigger)];
      if (!matches.length)
        return;

      for (const match of matches) {
        const start = match.index;
        const end = start + match[0].length;
        const plainClasses = match[1] + match[3] + match[1];
        code.overwrite(start, end, plainClasses);
      }
    },
  };
}
