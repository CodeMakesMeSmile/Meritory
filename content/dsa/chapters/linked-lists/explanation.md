# Linked lists

A linked list is a chain of nodes. Each node holds a value and a pointer to the next node, and the last node points to nothing. All you're given is the first node, called the head. There's no index to jump to, so reaching the tenth node means following nine pointers.

That sounds like a step back from an array, and for reading by position it is. The trade is that a node can be added or removed anywhere in O(1), once you're holding the node before it, because nothing has to shift. Almost every linked list problem comes down to changing a few pointers in the right order without losing the rest of the list.

In this chapter a node looks like this. The code runner gives you the class, so you don't write it yourself, and `new ListNode(0, head)` makes a node holding 0 that points to `head`.

```ts
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}
```

## What each one costs

| Task | Array | Linked list |
|---|---|---|
| Read the value at position i | O(1) | O(i), following pointers from the head |
| Add or remove at the front | O(n), everything shifts | O(1) |
| Add or remove after a node you hold | O(n), everything after it shifts | O(1) |
| Find the length | O(1) | O(n), unless you keep a count |

The extra memory a question allows matters more here than usual. Copying the values into an array makes most list problems easy, but it costs O(n) memory. Interviewers usually ask for O(1) extra memory, which means working with the nodes you were given and moving pointers around.

## Reversing a list

To reverse a list, walk it once and turn each pointer around so it points to the node before it. Three variables do the work: `prev`, the part already reversed, `current`, the node being turned, and `next`, the rest of the list.

```ts
let prev: ListNode | null = null;
let current = head;
while (current) {
  const next = current.next;
  current.next = prev;
  prev = current;
  current = next;
}
return prev;
```

The order of the four lines inside the loop is the whole trick. Save `current.next` **before** you change it. Once `current.next` points backward, it's the only link you had to the rest of the list, and without the saved copy that part is gone.

When the loop ends, `current` is null and `prev` is the old last node, which is the new head. Returning `current` or the old `head` is a common slip. The old head is now the tail, and it should point to null, which it does because `prev` started as null.

A recursive version also works, but it goes one call deep per node. A list of 100,000 nodes is far deeper than Python allows by default, so prefer the loop.

## Reversing one stretch

To reverse only the nodes from position `first` to position `last`, counting from 1, find the node just before the stretch. Reverse the stretch with the same loop, counting how many nodes you turn. Then join the ends back up: the node before the stretch points to the stretch's old last node, and the stretch's old first node points to whatever came after.

```ts
const dummy = new ListNode(0, head);
let before = dummy;
for (let i = 1; i < first; i++) before = before.next as ListNode;
const start = before.next as ListNode;
let prev: ListNode | null = null;
let current: ListNode | null = start;
for (let i = first; i <= last; i++) {
  const next = (current as ListNode).next;
  (current as ListNode).next = prev;
  prev = current;
  current = next;
}
before.next = prev;
start.next = current;
return dummy.next;
```

Draw it once on paper with five nodes. It's easy to connect one end and forget the other.

## The dummy head

When the first node can change, as it can when the stretch starts at position 1, you'd normally need a special case: there's no node before the head to update. A dummy head removes that case. Make a spare node that points to the head, do the work as if every real node had one before it, and return `dummy.next` at the end.

Reach for a dummy whenever the answer might start with a different node than the input did: removing nodes that could include the first one, building a new list one node at a time, or reversing a stretch that could start at the head. It costs one extra node, which is O(1).

## Fast and slow pointers: the middle

To find the middle in one pass, move two pointers from the head. `slow` moves one node per step and `fast` moves two. When `fast` runs off the end, `slow` has gone half as far, so it's at the middle.

```ts
let slow = head;
let fast = head;
while (fast && fast.next) {
  slow = slow.next;
  fast = fast.next.next;
}
return slow;
```

With an odd number of nodes there's one middle, and `slow` stops on it. With an even number there are two, and this loop stops on the **second** one: for `1, 2, 3, 4`, it stops on 3. To stop on the first middle instead, loop while `fast.next && fast.next.next`. Check which one a question wants, because it changes where you split the list later.

The middle is often a first step. To check whether a list reads the same both ways in O(1) memory, find the middle, reverse the second half, and walk the two halves side by side. Reverse the second half back afterward if the caller still needs the list.

## Cycles

A broken list can have its last node point back to an earlier node instead of to nothing. Walking it never ends. A set of the nodes you've seen catches the loop, but it costs O(n) memory.

Fast and slow pointers catch it in O(1). If there's no loop, `fast` reaches the end. If there is one, both pointers end up going around it, and each step `fast` gains exactly one node on `slow`. A gap that shrinks by one each step can't jump past zero, so `fast` lands on `slow` within one lap.

```ts
let slow = head;
let fast = head;
while (fast && fast.next) {
  slow = slow.next as ListNode;
  fast = fast.next.next;
  if (slow === fast) return true;
}
return false;
```

Compare the nodes themselves, not their values. Two different nodes can hold the same value.

**Where the loop starts.** Say the loop starts `a` nodes from the head, the pointers meet `b` nodes into the loop, and the loop is `c` nodes long. When they meet, `slow` has gone `a + b` steps and `fast` twice that. The extra distance `fast` went is whole laps, so `a + b` is a multiple of `c`. That means walking `a` more steps from the meeting point finishes a whole number of laps and lands on the start of the loop. You don't know `a`, but you don't need to: put one pointer back at the head, leave the other at the meeting point, and move both one step at a time. They meet at the start of the loop.

## Merging sorted lists

To merge two sorted lists, compare their fronts and attach the smaller node to the end of a result, then move forward in the list it came from. A dummy head gives the result somewhere to start, and a `tail` pointer marks where to attach next.

```ts
const dummy = new ListNode();
let tail = dummy;
while (a && b) {
  if (a.val <= b.val) {
    tail.next = a;
    a = a.next;
  } else {
    tail.next = b;
    b = b.next;
  }
  tail = tail.next;
}
tail.next = a ?? b;
return dummy.next;
```

When one list runs out, the rest of the other is already sorted and already linked, so one pointer attaches all of it. This reuses the nodes you were given, so it needs O(1) extra memory, and it's O(n + m).

**Merging k lists.** Merging them one at a time into a growing result copies the early nodes over and over, which is O(N × k) for N nodes in all. Pair the lists up instead: merge list 0 with 1, 2 with 3, and so on, then pair up the results. Each round halves the number of lists and touches every node once, so it's O(N log k). A heap of the k fronts gets the same time, where your language has one.

## The nth node from the end

To remove the nth node from the end in one pass, you need to stop on the node **before** it. Put two pointers on a dummy head. Move `lead` n + 1 steps ahead. Then move both together until `lead` runs off the end. The gap between them never changes, so `trail` stops exactly n + 1 nodes before the end, on the node before the one to remove.

```ts
const dummy = new ListNode(0, head);
let lead: ListNode | null = dummy;
let trail = dummy;
for (let i = 0; i <= n; i++) lead = (lead as ListNode).next;
while (lead) {
  lead = lead.next;
  trail = trail.next as ListNode;
}
trail.next = (trail.next as ListNode).next;
return dummy.next;
```

The dummy matters when n is the length of the list, so the node to remove is the head. Without it, there's no node before the head for `trail` to stop on.

The same fixed gap finds the place to cut a list when moving its last k nodes to the front. Two passes, one to count and one to walk, are also O(n), so the single pass is about skill more than speed. Interviewers like to ask for it anyway.

## Rearranging in place

Some problems ask for a new order, like first, last, second, second to last, and so on, using only the nodes you have. Break the job into steps you already know:

1. Find the middle with fast and slow pointers.
2. Cut the list there, so the first half ends in null.
3. Reverse the second half.
4. Weave the halves together, one node from each in turn.

Cutting matters. If the first half still points into the second, the weave makes a loop, and the next walk over the list never ends. For `1, 2, 3, 4, 5`, stop on the first middle, 3, cut after it, and reverse to get `5, 4`. Weaving `1, 2, 3` with `5, 4` gives `1, 5, 2, 4, 3`.

Grouping the nodes at odd positions before the ones at even positions uses the same idea with two tails. Walk the list once, attach each node to the end of the odd group or the even group in turn, then point the odd group's last node at the start of the even group, and end the even group with null.

Before you start, ask about the edges: an empty list, a list of one or two nodes, a change that touches the head or the tail, values that repeat, and whether the list might loop.
