export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function outputLabel(type: string, index: number): string {
  if (type === "ORIGINAL") return "ORIGINAL";
  return `${type} ${pad2(index)}`;
}
