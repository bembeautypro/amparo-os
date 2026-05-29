import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isThisYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Ex.: "Hoje, 14h", "Amanhã, 14h30", "Sex 23/05, 10h", "23/05/2027, 10h".
 */
export function formatRelativeDateTime(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  const time = format(d, d.getMinutes() === 0 ? "H'h'" : "H'h'mm", {
    locale: ptBR,
  });
  if (isToday(d)) return `Hoje, ${time}`;
  if (isTomorrow(d)) return `Amanhã, ${time}`;
  if (isYesterday(d)) return `Ontem, ${time}`;
  if (isThisYear(d)) {
    return `${format(d, "EEE dd/MM", { locale: ptBR })}, ${time}`;
  }
  return `${format(d, "dd/MM/yyyy", { locale: ptBR })}, ${time}`;
}

export function formatShortDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}
