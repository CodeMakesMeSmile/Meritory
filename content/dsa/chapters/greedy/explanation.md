# Greedy algorithms

A greedy algorithm builds its answer one choice at a time. At each step it takes whatever looks best right now, and it never goes back to change its mind. When that works, the answer is usually short and fast, often a sort and one pass.

The hard part isn't the code. It's knowing whether the greedy choice is actually right, because a greedy answer that's wrong still looks reasonable and passes the first few cases you try.

## When a greedy choice is safe

A greedy answer is right when two things hold.

1. **Some best answer starts with the greedy choice.** You don't need every best answer to agree with it, just one.
2. **What's left is a smaller copy of the same problem.** After the choice, the rest of the answer can be built the same way.

The first one is where greedy ideas fail. Take coins worth 1, 3, and 4, and the amount 6. Always taking the biggest coin that fits gives 4, then 1, then 1, which is three coins. But 3 and 3 is two. The biggest coin isn't part of any best answer here, so the choice isn't safe, and the problem needs the fewest coins table from the dynamic programming chapter.

With coins worth 1, 5, 10, and 25, the biggest coin first does happen to work. That's a property of those particular values, not of the method, which is why a greedy idea needs a reason and not just a few cases that pass.

Before trusting a greedy idea, try to break it. Build a small case where the greedy choice looks good but blocks something better, like a long talk that starts early or a big coin that leaves an awkward remainder. If you can, check it against a brute force answer on small inputs.

## The exchange argument

The usual way to show a greedy choice is safe is an **exchange argument**. In plain words: take any best answer. If it doesn't make the greedy choice, swap the greedy choice in, and show the answer gets no worse. Then there's always a best answer that agrees with the greedy one, step by step.

Here's one in full. A mechanic has a queue of repairs, all waiting from opening time, and wants the smallest total wait, where each customer waits until their own repair is done. The greedy choice is the shortest repair first.

Suppose some order puts a longer repair `a` right before a shorter one `b`, starting at time `t`. The first finishes at `t + a`, and the second at `t + a + b`. Swap them, and they finish at `t + b` and `t + a + b`. The second finish time is the same, the first is `a - b` sooner, and nobody else moves. So any order with a longer repair before a shorter one can be improved, and the best order has none, which is shortest first.

The intervals chapter used the same kind of swap to show that keeping the earliest end is safe. The heaps chapter's cable joining, always joining the two shortest pieces, has an exchange argument behind it too.

## Reach and jumps

A row of posts, where from post `i` you can move forward by up to `jump[i]` posts. Can you reach the last one?

You don't need to know which posts you'd stop at, only how far you could get. Walk the posts, keeping the farthest post any earlier post can reach. If you ever stand on a post past that, you can't have got there, and nothing beyond it can be reached either.

```ts
let farthest = 0;
for (let i = 0; i < jump.length; i++) {
  if (i > farthest) return false;
  farthest = Math.max(farthest, i + jump[i]);
}
return true;
```

That's O(n) time and O(1) memory, against O(n²) or worse for trying every route.

**The fewest jumps.** Think in rounds, like the levels of a breadth-first search, but with no queue. The posts you can reach in k jumps form one unbroken stretch. The stretch for k + 1 jumps ends at the farthest post any post in the current stretch can reach. Count the rounds until a stretch covers the last post. If a round reaches no further than the one before, you're stuck.

```ts
let jumps = 0;
let roundEnd = 0;
let farthest = 0;
for (let i = 0; i < jump.length - 1; i++) {
  farthest = Math.max(farthest, i + jump[i]);
  if (i === roundEnd) {
    if (farthest <= i) return -1;
    jumps++;
    roundEnd = farthest;
  }
}
return jumps;
```

Jumping as far as possible each time isn't the same thing, and it's a classic trap. From a post that reaches 2, landing on the far post with a jump of 1 can be worse than landing one short on a post with a jump of 5. Rounds avoid that, since they look at everything the current round could reach.

## The best running total

What's the best total of a run of values next to each other? Checking every run is O(n²). One pass is enough, and it's known as Kadane's algorithm.

Keep the best total of a run that **ends here**. At each value, that run either carries on from the previous one or starts fresh with this value alone. Start fresh when the run so far adds up to less than zero, since a negative start only drags down anything built on it.

```ts
let here = values[0];
let best = values[0];
for (let i = 1; i < values.length; i++) {
  here = Math.max(values[i], here + values[i]);
  best = Math.max(best, here);
}
```

Start from the first value, not from 0. If every value is negative, the best run is the largest single value, and starting at 0 would wrongly answer 0, the total of an empty run. Ask whether an empty run is allowed.

**In a circle.** When the values sit in a ring, the best run either doesn't wrap, which is the answer above, or it wraps past the end. A run that wraps is everything except one run in the middle, so its best total is the grand total minus the **worst** run, found with the same pass using `min` instead of `max`. Take the better of the two. The one exception is when every value is negative. The worst run is then the whole ring, and leaving it out leaves nothing, so use the run that doesn't wrap.

## A circuit with fuel stops

A vehicle goes round a loop of stops. At stop `i` it picks up `gain[i]` fuel, and the trip to the next stop uses `cost[i]`. It starts empty. Where can it start and make it all the way round?

Two facts make this one pass.

1. **If the total picked up is less than the total used, no start works.** If it's at least as much, some start does.
2. **If the tank goes below zero on the way from start `s` to stop `j`, no stop from `s` to `j` works either.** The vehicle reached each of those stops with zero or more in the tank, so starting at one of them with nothing can only arrive at `j` with the same or less. So the next stop to try is `j + 1`.

```ts
let total = 0;
let tank = 0;
let start = 0;
for (let i = 0; i < gain.length; i++) {
  total += gain[i] - cost[i];
  tank += gain[i] - cost[i];
  if (tank < 0) {
    start = i + 1;
    tank = 0;
  }
}
return total >= 0 ? start : -1;
```

Each stop is visited once, so it's O(n) time with O(1) memory. The start it returns is the first that works, since every stop before it was ruled out.

Another way to see it uses a running total of `gain - cost`. Starting at stop `s`, the tank at any later point is the running total there minus the running total at `s`. So a start works when the running total never drops below its value at the start, all the way round the loop, counting the part after it wraps.

## Cutting by last positions

A string of letters has to be cut into pieces next to each other, so that each letter shows up in only one piece. What's the most pieces?

First find where each letter appears for the last time. Then walk the string, keeping how far the current piece has to reach: the farthest last position of any letter in it so far. When you reach that point, the piece can end there, so cut.

```ts
const last = new Map<string, number>();
for (let i = 0; i < text.length; i++) last.set(text[i], i);
const sizes: number[] = [];
let start = 0;
let reach = 0;
for (let i = 0; i < text.length; i++) {
  reach = Math.max(reach, last.get(text[i]) as number);
  if (i === reach) {
    sizes.push(i - start + 1);
    start = i + 1;
  }
}
```

Cutting as early as possible is safe, because any cut after it could still be made, and an early cut never blocks a later one. With only lowercase letters, an array of 26 positions does the same job as the map.

The same shape works whenever each item says how far its piece has to reach. The item doesn't have to be a letter that repeats. It could be a number that has to end up at a given place.

## Assigning by sorting two lists

Many greedy problems match items to people: pots to seedlings, lockers to runners, seats in a canoe. Sort both lists, and the right pairs are usually found by walking them together with two pointers.

**The most matches.** Each seedling needs a pot at least as wide as it needs. Give the smallest seedling the smallest pot that fits it. A bigger pot would be wasted on it, since anything that fits the small pot fits the bigger one too.

```ts
needs.sort((a, b) => a - b);
pots.sort((a, b) => a - b);
let matched = 0;
for (const pot of pots) {
  if (matched < needs.length && pot >= needs[matched]) matched++;
}
```

**The least total distance.** To pair people and spots along a line so the total distance walked is smallest, sort both and pair them in order. The exchange argument: if two pairs cross, with the left person going to the right spot and the right person to the left one, uncrossing them never adds distance. With no crossings left, the pairs are in sorted order.

**Two to a canoe.** When a canoe holds at most two people and a weight limit, sort the weights. The heaviest person needs a canoe either way. If anyone can share it with them, the lightest can, and giving them the lightest is never worse, since a lighter partner leaves the heavier ones for later pairs where they might fit.

## Greedy or dynamic programming?

| Problem | What works | Why |
|---|---|---|
| Fewest coins with coins worth 1, 3, and 4 | Dynamic programming | The biggest coin first fails for 6 |
| Most talks on one stage | Greedy, earliest end first | Swapping in the earliest end never hurts |
| Most value in a bag, items taken whole | Dynamic programming | Taking the best value per kilogram first can leave the bag half empty |
| Most value in a bag, items can be cut | Greedy, best value per kilogram | A cut item fills the space exactly |
| Can you reach the last post | Greedy, farthest reach | Only how far you can get matters |

When you can't find an exchange argument and a small case breaks the greedy choice, it's probably dynamic programming.

Before you start, ask about the edges: an empty input, a single item, every value negative, values that tie, and whether an empty answer, like a run of no days, is allowed.
