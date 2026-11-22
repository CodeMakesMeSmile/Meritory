# Weighted graphs

In the graphs chapter every edge cost the same, so the cheapest path was the one with the fewest edges, and breadth-first search found it. Real edges rarely cost the same. A road takes 4 minutes or 40, a delivery route costs 100 or 600, and a pipe between two buildings is short or long. Each edge now carries a **weight**, and the cost of a path is usually the sum of its weights.

This chapter builds on two earlier ones. It uses the adjacency lists, topological order, and union-find from the graphs chapter, and the heap from the heaps chapter. It doesn't teach them again, so look back at those chapters if any of them feel shaky.

A few words come up again and again.

- To **relax** an edge from `a` to `b` with weight `w` is to ask "is going through `a` a cheaper way to reach `b`?", and if it is, to lower `b`'s best known cost to `cost[a] + w`.
- A **shortest path** means the cheapest one, by total weight, even when it has more edges than another path.
- A **spanning tree** joins every node with exactly n - 1 edges and no cycle. A **minimum spanning tree** is one whose edges add up to the least possible total.

## How the cases write a weighted graph

Nodes are numbered from 0 to n - 1, and you're given `n`. Edges come as `int[][]`, with each edge as three numbers, `[a, b, w]`. The statement says whether an edge goes one way or both ways. As before, take `n` from the input, since a node with no edges never shows up in the list.

The adjacency list now holds pairs, each a neighbour and the weight of the edge to it.

```ts
const out: number[][][] = Array.from({ length: n }, () => []);
for (const [a, b, w] of edges) {
  out[a].push([b, w]);
  out[b].push([a, w]); // leave this line out when edges go one way
}
```

When nothing reaches a node, its cost stays at infinity. Use `Infinity` in TypeScript, `float("inf")` in Python, and a large value like `Integer.MAX_VALUE` in Java and C, then turn it into -1 or whatever the question asks for at the end. In Java and C, check for that large value before adding a weight to it, since adding to `Integer.MAX_VALUE` overflows into a negative number.

## Dijkstra's algorithm

Dijkstra's algorithm finds the cheapest path from one start to every node when no edge weight is negative. It works like a breadth-first search where the queue is a min-heap ordered by cost. The heap always hands back the node with the cheapest known cost that hasn't been settled yet.

```ts
const cost = new Array<number>(n).fill(Infinity);
cost[start] = 0;
const heap = new Heap<number[]>((a, b) => a[0] < b[0]);
heap.push([0, start]);
while (heap.size() > 0) {
  const [at, node] = heap.pop() as number[];
  if (at > cost[node]) continue; // a stale entry, so skip it
  for (const [next, w] of out[node]) {
    if (at + w < cost[next]) {
      cost[next] = at + w;
      heap.push([cost[next], next]);
    }
  }
}
```

`Heap` is the small class from the heaps chapter, and each entry is `[cost, node]`. In Python, push tuples onto `heapq`, and in Java, use a `PriorityQueue<int[]>` compared with `Integer.compare(a[0], b[0])`.

**Why the first pop is final.** When a node comes out of the heap, every other entry in the heap costs at least as much. Since no edge is negative, any other route to this node goes through one of those entries and then adds more weight, so it can't come out cheaper. The node's cost is settled.

**Skipping stale entries.** A node can be pushed more than once: first by a dear route, then again when a cheaper route turns up. The heaps from the heaps chapter can't find and lower an entry already inside them, so instead the old entry stays and goes stale. When an entry comes out costing more than the node's best known cost, the node was already settled by a cheaper entry, so skip it. Without that check the answer is still right, but the search can redo the same node's edges many times.

There's one push per successful relax, so the heap holds at most m + 1 entries, and the whole search is O((n + m) log m) time with O(n + m) memory. Since log m is at most 2 log n, that's often written as O((n + m) log n).

If you only need the cost to one goal, you can stop the moment the goal comes out of the heap, since its cost is final then.

## When a signal reaches everyone

Some questions send something out from one start and ask when it has reached every node, like an alert spreading through a network where each link takes its own time. Everything travels at once, so each node hears it at the cost of its cheapest path. The time for everyone to hear it is the **largest** of those costs, found after one run of Dijkstra's algorithm.

Check for nodes that are never reached. If any cost is still infinity, the signal never gets everywhere, and the answer is usually -1. In an unweighted graph this is the same idea as the spreading questions in the graphs chapter, with the heap taking the place of the queue.

## Why negative edges break it

Dijkstra's algorithm counts on paths only ever getting dearer as they grow. A negative edge breaks that.

```text
0 → 1 costs 2
0 → 2 costs 5
2 → 1 costs -4
```

Starting from 0, node 1 comes out of the heap first, at cost 2, and is settled. Later, node 2 comes out at 5, and the edge to 1 would make it 5 - 4 = 1. That's cheaper than the settled cost, but the algorithm has already treated 1 as final and moved on from it. Anything it reached through 1 is wrong too.

It gets worse with a **negative cycle**, a loop whose weights add up to less than zero. Going round it once more always lowers the cost, so there's no cheapest path at all to anything the loop can reach. A question with negative edges either promises there's no negative cycle or asks you to find one.

## Bellman-Ford

Bellman-Ford handles negative edges by giving up on settling nodes early. It relaxes **every** edge, then does it again, round after round.

```ts
const cost = new Array<number>(n).fill(Infinity);
cost[start] = 0;
for (let round = 1; round < n; round++) {
  let changed = false;
  for (const [a, b, w] of edges) {
    if (cost[a] !== Infinity && cost[a] + w < cost[b]) {
      cost[b] = cost[a] + w;
      changed = true;
    }
  }
  if (!changed) break;
}
```

After round 1, every path of one edge has been tried. After round 2, every path of up to two edges, and so on. A cheapest path with no cycle visits each node at most once, so it has at most n - 1 edges, and n - 1 rounds are enough. That's O(n × m) time, much slower than Dijkstra's algorithm, so only reach for it when weights can be negative or the number of edges is limited.

**Finding a negative cycle.** Run one more round. Without a negative cycle, every cost was already final after n - 1 rounds, so nothing can change. If any edge still relaxes in round n, a negative cycle can be reached from the start. Keep the `cost[a] !== Infinity` check. A negative cycle the start can't reach doesn't count, and in Java or C, where infinity is a large number, adding a negative weight to it makes an unreached loop look like a real cost.

**Cheapest with at most k stops.** Some questions limit how many nodes a path can pass through, like a parcel allowed at most k stops between depots. A path with k stops uses k + 1 edges, so run exactly k + 1 rounds. There's a trap, though. In the loop above, an edge can use a cost that was lowered earlier in the **same** round, so one round can chain several edges together. That's fine when the number of edges doesn't matter, but here it lets a path sneak in more edges than allowed. The fix is to read from a copy of the last round's costs.

```ts
let cost = new Array<number>(n).fill(Infinity);
cost[source] = 0;
for (let round = 0; round <= k; round++) {
  const next = cost.slice();
  for (const [a, b, w] of edges) {
    if (cost[a] !== Infinity && cost[a] + w < next[b]) next[b] = cost[a] + w;
  }
  cost = next;
}
```

Each round reads only `cost` and writes only `next`, so a round adds exactly one more edge to the paths it builds. That's O(k × m) time.

## Minimum spanning trees

Joining every building to a network, every house to the water main, or every beacon on a trail asks a different question from a shortest path. You don't care how far one node is from another, only that all of them end up joined, for the least total cost. That's a minimum spanning tree. It always has exactly n - 1 edges, since any more would make a cycle, and a cycle has an edge you could drop and still be joined.

It isn't the same as the cheapest paths from one node. Take a triangle where the edge between 0 and 1 costs 2, between 1 and 2 costs 3, and between 0 and 2 costs 4. The tree uses the edges costing 2 and 3, a total of 5. But the cheapest path from 0 to 2 is the direct edge at 4, which the tree leaves out.

Both algorithms below rest on one fact. Split the nodes into any two groups, and look at the edges that cross between them. The cheapest crossing edge is always safe to use, because any tree without it has to cross somewhere, and swapping that crossing for the cheapest one never costs more.

### Prim's algorithm

Prim's algorithm grows one tree from any start node. Keep a min-heap of edges leaving the tree, by weight. Pop the cheapest. If it leads to a node already in the tree, skip it, much like a stale entry in Dijkstra's algorithm. Otherwise add that node and its edge's weight, then push every edge from the new node.

```ts
const inTree = new Array<boolean>(n).fill(false);
const heap = new Heap<number[]>((a, b) => a[0] < b[0]);
heap.push([0, 0]);
let total = 0;
let joined = 0;
while (heap.size() > 0 && joined < n) {
  const [w, node] = heap.pop() as number[];
  if (inTree[node]) continue;
  inTree[node] = true;
  total += w;
  joined++;
  for (const [next, weight] of out[node]) {
    if (!inTree[next]) heap.push([weight, next]);
  }
}
```

It looks like Dijkstra's algorithm, and the only real difference is what goes in the heap. Dijkstra's algorithm pushes the whole cost from the start, `cost + w`. Prim's algorithm pushes just the edge's own weight `w`, because it only cares what it costs to bring this node into the tree. With a heap, it's O(m log m).

When every pair of nodes has an edge, like points on a map where any two can be wired together, there are about n²/2 edges and the heap gets crowded. Then a plain array is better. Keep, for each node outside the tree, the cheapest edge that reaches it from the tree. Each step, scan for the cheapest of those, add that node, and update the others from it. That's n steps of O(n) each, so O(n²) with no heap, and no edge list either, since each distance is worked out when it's needed.

### Kruskal's algorithm

Kruskal's algorithm builds the tree from the cheapest edges up. Sort every edge by weight. Then go through them in order, and use union-find from the graphs chapter to keep track of which nodes are already joined. Take an edge when its two ends are in different groups, and skip it when they're already joined, since it would close a cycle.

```ts
edges.sort((x, y) => x[2] - y[2]);
let total = 0;
let used = 0;
for (const [a, b, w] of edges) {
  if (union(a, b)) {
    total += w;
    used++;
    if (used === n - 1) break;
  }
}
const joinedAll = used === n - 1;
```

Sorting costs O(m log m), and the union-find calls are close to O(1) each, so sorting is the whole cost. Stop once the tree has n - 1 edges. If the edges run out first, some node can't be reached, and the graph has no spanning tree.

**Which to choose.** Kruskal's algorithm suits an edge list, especially a sparse one, and it's short to write once you have union-find. Prim's algorithm suits an adjacency list, and its array version suits a dense graph where every pair is an edge. Both give the same total.

## Costs of 0 and 1 with a deque

Sometimes every edge costs either 0 or 1. Riding with the traffic is free and walking against it costs 1, or crossing open ground is free and clearing a snowdrift costs 1. Dijkstra's algorithm works, but there's a faster way with a **deque**, a queue you can add to at either end.

Take a node from the front. For each edge, if it lowers the neighbour's cost, add the neighbour to the **front** when the edge costs 0, and to the **back** when it costs 1.

```ts
const cost = new Array<number>(n).fill(Infinity);
const done = new Array<boolean>(n).fill(false);
cost[start] = 0;
const deque = [start]; // use a real deque, since shift is O(n) on an array
while (deque.length > 0) {
  const node = deque.shift() as number;
  if (done[node]) continue;
  done[node] = true;
  for (const [next, w] of out[node]) {
    if (cost[node] + w < cost[next]) {
      cost[next] = cost[node] + w;
      if (w === 0) deque.unshift(next);
      else deque.push(next);
    }
  }
}
```

The deque only ever holds nodes of two costs, some d at the front and d + 1 at the back. A 0 edge keeps the same cost, so it belongs at the front with the others at d. A 1 edge makes d + 1, so it belongs at the back. That keeps the deque in order without a heap, and the whole search is O(n + m). As in Dijkstra's algorithm, a node can join more than once, so skip it when it's already done.

TypeScript has no built-in deque, and `shift` and `unshift` move every item, so the snippet above shows the idea but is slow on big inputs. A real one is a ring buffer, an array with a head and a tail index that wrap around. Python has `collections.deque`, and Java has `ArrayDeque`.

## Paths in a graph with no cycles

A directed graph with no cycles, often called a DAG, has a topological order, as in the graphs chapter. That order makes paths easy: if you relax each node's edges in topological order, every edge into a node has been relaxed before you reach it. So each node's cost is final when its turn comes, with no heap and no rounds.

```ts
const best = new Array<number>(n).fill(-Infinity);
best[start] = 0;
for (const node of order) {
  if (best[node] === -Infinity) continue;
  for (const [next, w] of out[node]) {
    best[next] = Math.max(best[next], best[node] + w);
  }
}
```

That finds the **longest** path from `start`, and swapping in `Infinity` and `Math.min` finds the shortest. It's O(n + m), including Kahn's algorithm to build `order`. Negative weights are fine too, since nothing is settled early.

The longest path is the reason to remember this. In a general graph it's a famously hard problem, because a cycle would let the path go round and round, and Dijkstra's algorithm can't simply flip to the most expensive edge. With no cycles that problem disappears. It answers questions like how soon a project can finish when tasks wait on each other: the finish time is the longest chain of work, also called the critical path. When the time sits on the tasks rather than the edges, give each task its own hours and add them as you go, so `finish[next]` is the largest `finish[node]` over everything it waits on, plus its own hours.

Leave out nodes the start can't reach, which is what the `-Infinity` check does. Kahn's algorithm still has to place them, since a node can only be ready once everything pointing to it is placed.

## When the worst step is what counts

Some paths are judged by their single worst step, not their total. A hiker wants the route whose steepest step is as gentle as possible. A boat over a flooded field can leave once the water covers the highest cell on its route. The cost of a path is then the **largest** weight on it, and the question asks for the path where that largest weight is smallest.

Dijkstra's algorithm still works if you change one line. Where it adds, `at + w`, take the larger instead, `Math.max(at, w)`. The proof still holds, because making a path longer can never make its worst step smaller, just as adding a weight that's 0 or more can never lower a sum.

```ts
const through = Math.max(at, w);
if (through < cost[next]) {
  cost[next] = through;
  heap.push([through, next]);
}
```

For a grid, the weight of a step can be the height difference between the two cells, or the height of the cell you step into. Read the question closely to see whether the starting cell counts.

Two other ways reach the same answer. Binary search on the answer, as in the binary search chapter, asks "can I cross using only steps up to t?" with a plain search for each t. Or sort the steps from smallest to largest and join cells with union-find, Kruskal style, until the two corners are in the same group. All three are fine in an interview, and the Dijkstra version is usually the shortest to write.

## Which tool fits

| The question asks | Reach for |
|---|---|
| The fewest edges, when every edge costs the same | Breadth-first search, from the graphs chapter |
| The cheapest path, with every edge costing 0 or 1 | A deque, with 0 edges added at the front |
| The cheapest path, with no negative edges | Dijkstra's algorithm with a heap |
| When something sent from one node reaches every node | Dijkstra's algorithm, then the largest cost |
| The cheapest path when edges can be negative, or whether a loop keeps getting cheaper | Bellman-Ford |
| The cheapest path with at most k stops | Bellman-Ford for k + 1 rounds, reading from a copy |
| The longest or shortest path when the graph has no cycles | Relaxing in topological order |
| The path whose worst step is smallest | Dijkstra's algorithm with the larger value in place of the sum |
| Joining every node for the least total | Kruskal's algorithm for an edge list, Prim's algorithm for a dense graph |

Before you start, ask about the edges: whether they go one way or both, whether a weight can be 0 or negative, whether two edges can join the same pair, what to return when something can't be reached, and whether the total can grow past 32 bits.
