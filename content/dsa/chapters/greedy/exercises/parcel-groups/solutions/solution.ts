export function groupSizes(labels: string): number[] {
  // Where each van's last parcel sits
  const last = new Array<number>(26).fill(0);
  for (let i = 0; i < labels.length; i++) {
    last[labels.charCodeAt(i) - 97] = i;
  }
  const sizes: number[] = [];
  let groupStart = 0;
  let groupEnd = 0;
  for (let i = 0; i < labels.length; i++) {
    // The group has to reach this van's last parcel
    groupEnd = Math.max(groupEnd, last[labels.charCodeAt(i) - 97]);
    // Every van in the group is finished here, so cut as early as possible
    if (i === groupEnd) {
      sizes.push(i - groupStart + 1);
      groupStart = i + 1;
    }
  }
  return sizes;
}
