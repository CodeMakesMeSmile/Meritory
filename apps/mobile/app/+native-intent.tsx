import { pageFromLink } from "../lib/app-link";

export function redirectSystemPath({ path }: { path: string }) {
  return pageFromLink(path);
}
