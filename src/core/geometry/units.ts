import type { Units } from "../types/product-pack";

const TO_METERS: Record<Units, number> = { m: 1, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254 };

export function toMeters(value: number, units: Units): number {
  return value * TO_METERS[units];
}

export function fromMeters(value: number, units: Units): number {
  return value / TO_METERS[units];
}

export function convertUnits(value: number, from: Units, to: Units): number {
  return fromMeters(toMeters(value, from), to);
}

export function unitDecimals(units: Units): number {
  switch (units) {
    case "m":
      return 2;
    case "cm":
      return 0;
    case "mm":
      return 0;
    case "ft":
      return 2;
    case "in":
      return 1;
  }
}

export function formatLength(value: number, units: Units): string {
  return `${value.toFixed(unitDecimals(units))} ${units}`;
}

export function formatDimensions(w: number, d: number, h: number, units: Units): string {
  const dec = unitDecimals(units);
  return `${w.toFixed(dec)} × ${d.toFixed(dec)} × ${h.toFixed(dec)} ${units}`;
}
