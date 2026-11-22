export function reversePlaylist(songs: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let current = songs;
  while (current) {
    // Save the way forward before turning this pointer around
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  return prev;
}
