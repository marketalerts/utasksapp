export type FontClassShorthand = [number, number?];

export type FontClass = {
  fontSize: number | string;
  lineHeight: number;
  letterSpacing?: number;
  weight?: number;
};

export type Weight = number;

export type Modifier = ((f: FontClass) => Partial<FontClass>);

export type ModifierInfo = Partial<FontClass> | Modifier;

export type ModifierRecord = ModifierInfo | [Weight, ModifierInfo?];

export function font(fontSize: number, lineHeight: number, letterSpacing?: number): FontClass {
  return {
    fontSize,
    lineHeight,
    letterSpacing,
  };
}
