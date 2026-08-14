import { formatDistanceToNow } from "date-fns";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export const DateFormat = (date: string) => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });
}

/**
 * Builds an absolute media URL from a backend-provided path.
 *
 * Handles all the formats the backend can return:
 * - already absolute (starts with "http") -> used as-is
 * - relative with leading slash ("/media/...") -> prefixed with the backend URL
 * - relative without leading slash ("media/...") -> prefixed with the backend URL
 * - null/undefined/empty -> falls back to the default placeholder avatar
 */
export const mediaUrl = (path: string | null | undefined): string => {
  if (!path) return "/person.jpg";
  if (path.startsWith("http")) return path;

  const base = BACKEND_URL.replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
