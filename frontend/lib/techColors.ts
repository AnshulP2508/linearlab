const GOLDEN_ANGLE = 137.508;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function hslColor(hue: number, saturation: number, lightness: number): string {
  return `hsl(${Math.round(hue)} ${Math.round(saturation)}% ${Math.round(lightness)}%)`;
}

function colorFromName(name: string, hue: number): string {
  const key = name.toLowerCase().trim();
  const hash = hashString(key);
  return hslColor(hue, 58 + (hash % 14), 42 + ((hash >>> 4) % 12));
}

/**
 * Assigns a distinct color per technology for charts shown together.
 * New tech names automatically receive a stable hue derived from the name,
 * nudged along the color wheel when needed to stay visually separated.
 */
export function assignTechColors(names: string[]): Map<string, string> {
  const colorByKey = new Map<string, string>();
  if (names.length === 0) return colorByKey;

  const minGap = Math.max(30, Math.floor(360 / names.length));
  const usedHues: number[] = [];

  for (const name of names) {
    const key = name.toLowerCase().trim();
    if (!key || colorByKey.has(key)) continue;

    const hash = hashString(key);
    let hue = (hash * GOLDEN_ANGLE) % 360;
    let attempts = 0;

    while (
      usedHues.some((existing) => hueDistance(existing, hue) < minGap) &&
      attempts < 40
    ) {
      hue = (hue + GOLDEN_ANGLE) % 360;
      attempts += 1;
    }

    usedHues.push(hue);
    colorByKey.set(key, colorFromName(name, hue));
  }

  return colorByKey;
}

/** Stable color for a single technology (e.g. legends outside grouped charts). */
export function getTechColor(name: string): string {
  const key = name.toLowerCase().trim();
  if (!key) return "#94a3b8";

  const hue = (hashString(key) * GOLDEN_ANGLE) % 360;
  return colorFromName(name, hue);
}
