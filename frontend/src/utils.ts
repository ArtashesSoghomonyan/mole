import { formatDistanceToNow } from "date-fns";

export const DateFormat = (date: string) => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });
}
