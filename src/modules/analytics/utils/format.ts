/** Presentation formatters shared by every analytics surface (id-ID locale). */

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 mnt";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours} jam ${minutes} mnt` : `${minutes} mnt`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
