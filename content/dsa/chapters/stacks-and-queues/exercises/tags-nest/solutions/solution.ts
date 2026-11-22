export function firstBadTag(tags: string[]): number {
  const open: string[] = [];
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    if (!tag.startsWith("/")) {
      open.push(tag);
    } else if (open.pop() !== tag.slice(1)) {
      // Nothing was open, or the newest open tag has another name
      return i;
    }
  }
  return open.length > 0 ? tags.length : -1;
}
