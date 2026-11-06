/** Deterministic competition identity colour. Same league, same hue everywhere.
   Four Signal hues only — green, teal, amber, alert — so the register stays
   a colour code rather than a rainbow. */
export const HUE_COUNT = 4;

export function hueIndex(id: number | string): number {
  const n = typeof id === "number" ? id : [...String(id)].reduce((t, c) => t + c.charCodeAt(0), 0);
  // Knuth multiplicative hash: adjacent league ids would otherwise land on
  // the same hue and the register would read as two colours.
  return Math.imul(Math.abs(Math.trunc(n)), 2654435761) >>> 30;
}

export function hueClass(id: number | string): string {
  return `tl-h${hueIndex(id)}`;
}
