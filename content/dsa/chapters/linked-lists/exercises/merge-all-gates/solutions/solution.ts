function mergeTwo(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) {
      tail.next = a;
      tail = a;
      a = a.next;
    } else {
      tail.next = b;
      tail = b;
      b = b.next;
    }
  }
  tail.next = a ?? b;
  return dummy.next;
}

export function mergeGates(gates: (ListNode | null)[]): ListNode | null {
  if (gates.length === 0) return null;
  // Each round merges lists step apart, so every node is merged about log k times
  for (let step = 1; step < gates.length; step *= 2) {
    for (let i = 0; i + step < gates.length; i += step * 2) {
      gates[i] = mergeTwo(gates[i], gates[i + step]);
    }
  }
  return gates[0];
}
