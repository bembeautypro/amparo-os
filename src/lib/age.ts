/** Calcula idade em anos completos a partir de uma data ISO (YYYY-MM-DD). */
export function calcAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}

export function formatAge(birthDate?: string | null): string | null {
  const age = calcAge(birthDate);
  if (age == null) return null;
  return `${age} ${age === 1 ? "ano" : "anos"}`;
}
