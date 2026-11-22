# Graphs

A graph is a set of nodes joined by edges. Linked lists and trees are graphs with strict shapes. A general graph has none of those limits: it can loop back on itself, a node can have any number of neighbours, some parts may not connect at all, and edges may only go one way.

Graph questions rarely say "graph". They talk about islands and ferries, a grid of cells, people passing on news, or courses that need other courses first. The first step is spotting the nodes and the edges.

A few words come up again and again.

- An **undirected** edge goes both ways, like a footpath. A **directed** edge goes one way, like "a tells b" or "a must happen before b".
- A **path** follows edges from node to node. A **cycle** is a path that comes back to where it started.
- A **connected part**, often called a component, is a group of nodes that can all reach each other, with no edge leading out of the group.
- In an **unweighted** graph every edge costs the same. This chapter is all unweighted. When edges have different costs, the shortest path needs Dijkstra's algorithm, which swaps the queue below for a heap from the heaps chapter.

## How the cases write a graph

Nodes are numbered from 0 to n - 1, and you're given `n`. Edges come as a list of pairs, like `[[0, 1], [1, 2]]`. The statement says whether a pair goes both ways or one way. Always take `n` from the input rather than from the edges, since a node with no edges never shows up in the list.

A grid comes as `int[][]`. Each cell is a node, and its neighbours are the cells directly up, down, left, and right. Diagonal cells aren't neighbours unless the question says so.

## Building an adjacency list

An edge list is hard to search. Finding one node's neighbours means scanning every edge. So the first step is almost always to build an **adjacency list**: for each node, the list of nodes it leads to.

```ts
const neighbours: number[][] = Array.from({ length: n }, () => []);
for (const [a, b] of edges) {
  neighbours[a].push(b);
  neighbours[b].push(a); // leave this line out when edges go one way
}
```

It takes O(n + m) time and memory, where m is the number of edges, and then listing a node's neighbours costs only as many steps as it has neighbours.

Make a fresh list for every node. `new Array(n).fill([])` in TypeScript and `[[]] * n` in Python both put the **same** list in every slot, so every node ends up with every edge.

The other common layout is an adjacency matrix, an n by n grid of true and false. It answers "is there an edge from a to b?" in O(1), but it takes O(n²) memory even when there are few edges, so it only suits small, crowded graphs.

## Depth-first search

A depth-first search goes as far as it can along one path, then backs up and tries the next. The big difference from walking a tree is that a graph can lead back to a node you've already visited. Without a record of what you've seen, the search goes round a cycle forever.

```ts
const seen = new Array<boolean>(n).fill(false);
const stack = [start];
seen[start] = true;
while (stack.length > 0) {
  const at = stack.pop() as number;
  for (const next of neighbours[at]) {
    if (!seen[next]) {
      seen[next] = true;
      stack.push(next);
    }
  }
}
```

Recursion is shorter to write, but it uses one call per node along the current path, and in a graph that path can be n nodes long. Python stops at about 1,000 nested calls by default, and other languages run out of stack too on big inputs. The exercises in this chapter allow graphs and grids big enough for that to happen, so their reference solutions keep their own stack, as above. Recursion is fine when a question promises the graph is small.

Each node goes on the stack once, and each edge is looked at once from each end, so the search is O(n + m).

**Counting the parts.** Loop over every node. Each one that hasn't been seen yet starts a new search, which marks its whole part. The number of searches started is the number of parts, and the total work is still O(n + m), since every node is marked exactly once.

**Two colours.** To split nodes into two sides so every edge crosses between them, search as usual and give each newly found node the other colour from the node it was reached from. If an edge ever joins two nodes of the same colour, no split is possible. That happens exactly when the graph has a cycle with an odd number of edges, like a triangle. Check every part, since one part can split fine while another can't.

## Grids

A grid is a graph where the edges are implied. Cell `(r, c)` has up to four neighbours, and a list of steps saves writing four almost identical blocks.

```ts
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [dr, dc] of STEPS) {
  const nr = r + dr;
  const nc = c + dc;
  if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
  // look at grid[nr][nc]
}
```

Check the bounds before reading the cell. A grid of `rows × cols` cells is a graph of that many nodes with at most four edges each, so a search is O(rows × cols).

To mark cells as seen, keep a second grid of true and false. Some answers overwrite the input instead, which saves memory but changes data the caller may still need, so ask first. When a single number per cell is handier, as in C or in union-find, number cell `(r, c)` as `r * cols + c`.

## Fewest steps with breadth-first search

The stacks and queues chapter used a queue to find the fewest moves. That's breadth-first search, and it works on any unweighted graph. It visits nodes in order of distance: every node 1 step away, then every node 2 steps away, and so on. So the first time it reaches a node is by the fewest edges.

```ts
const distance = new Array<number>(n).fill(-1);
distance[start] = 0;
const queue = [start];
for (let head = 0; head < queue.length; head++) {
  const at = queue[head];
  for (const next of neighbours[at]) {
    if (distance[next] === -1) {
      distance[next] = distance[at] + 1;
      queue.push(next);
    }
  }
}
```

Mark a node when it joins the queue, not when it leaves, or the same node can join many times. A distance of -1 doubles as "not seen yet". A depth-first search also finds **a** path, but not necessarily the shortest, because it might wander far down one branch before trying the direct route.

## Many starting points at once

Some questions start from many places: the distance from every cell to its nearest exit, or how long frost takes to spread from several frozen spots. Put **every** start in the queue at distance 0 before the loop begins. Then the search spreads from all of them together, and each node is first reached from whichever start is nearest.

It's the same as adding one extra node joined to every start and searching from that. One pass costs O(n + m). Searching from each start in turn would cost that much for every start.

For spreading over time, the answer is the largest distance reached. Then check whether anything was never reached at all, since a node walled off from every start means the spread never finishes.

## Cycles

**Undirected graphs.** During a search, finding a seen node that isn't the one you just came from means there's a cycle. Union-find, below, gives an even simpler test: an edge whose two ends are already in the same group closes a cycle.

**Directed graphs.** A seen set isn't enough here. In the graph `0 → 1`, `0 → 2`, `1 → 3`, `2 → 3`, node 3 is reached twice, but there's no cycle, because no path leads back to where it started. A depth-first search needs three states for each node: not started, in progress, and done. A node is in progress while the search is still exploring below it, so finding an edge to an in-progress node means the path has looped back on itself. Kahn's algorithm, next, finds cycles too, with no recursion at all.

## Topological order with Kahn's algorithm

When tasks have prerequisites, draw an edge from each prerequisite to the task that needs it. A **topological order** lists every task after all of its prerequisites. One exists exactly when the graph has no cycle.

Kahn's algorithm builds the order by counting. For each node, count its incoming edges, which is how many prerequisites it's still waiting on. Every node with a count of 0 is ready, so it goes in a queue. Take a ready node, add it to the order, and lower the count of every node it points to. Any count that reaches 0 means that node is ready too. Here `unlocks` is the adjacency list, from each node to the nodes that need it.

```ts
const waiting = new Array<number>(n).fill(0);
for (const [before, after] of edges) waiting[after]++;
const order: number[] = [];
for (let node = 0; node < n; node++) if (waiting[node] === 0) order.push(node);
for (let head = 0; head < order.length; head++) {
  for (const next of unlocks[order[head]]) {
    waiting[next]--;
    if (waiting[next] === 0) order.push(next);
  }
}
const hasCycle = order.length < n;
```

Nodes on a cycle, or waiting on one, never get down to 0, so they never join the order. That's the cycle check. It's O(n + m).

To find the fewest rounds when any number of ready tasks can run in the same round, take the ready nodes one whole round at a time, the way level order takes a tree one level at a time. The number of rounds is the length of the longest chain of prerequisites.

Two cautions. First, mind the direction. "a depends on b" means the edge goes from b to a, and getting it backward gives the order in reverse. Second, a graph usually has many valid orders. When a question wants one exact order, it has to give a rule, such as lowest number first, and then the queue becomes a heap.

## Union-find

Union-find, also called a disjoint set, keeps nodes in groups and answers two questions quickly: are these two nodes in the same group, and can these two groups become one? Each node points to a parent, and the node at the top of each chain, which points to itself, is the group's **root**. Two nodes are in the same group when they have the same root.

```ts
const parent = Array.from({ length: n }, (_, i) => i);
const rank = new Array<number>(n).fill(0);

function find(node: number): number {
  let root = node;
  while (parent[root] !== root) root = parent[root];
  while (parent[node] !== root) {
    const next = parent[node];
    parent[node] = root;
    node = next;
  }
  return root;
}

function union(a: number, b: number): boolean {
  let rootA = find(a);
  let rootB = find(b);
  if (rootA === rootB) return false;
  if (rank[rootA] < rank[rootB]) [rootA, rootB] = [rootB, rootA];
  parent[rootB] = rootA;
  if (rank[rootA] === rank[rootB]) rank[rootA]++;
  return true;
}
```

Two tricks keep the chains short.

- **Path compression.** After `find` reaches the root, it points every node it passed straight at the root, so the next `find` from any of them takes one step.
- **Union by rank.** Each root keeps a rank, an upper bound on its tree's height. A union hangs the shorter tree under the taller one, so heights grow slowly. When the ranks are equal, either can go on top, and the new root's rank goes up by one.

Without them, a run of unions can build one long chain, and `find` becomes O(n). With both, any run of calls costs about O(1) each. The exact bound grows so slowly that it's at most 4 for any graph that fits in memory.

`union` returning false is useful by itself. In an undirected graph, an edge whose ends already share a root closes a cycle. Union-find suits edges that arrive one at a time, with questions in between, because a depth-first search would have to start over after each edge. It can only join groups, though, never split them.

## Which tool fits

| The question asks | Reach for |
|---|---|
| How many separate groups are there? | A search from each unseen node, or union-find |
| The fewest steps, when every step costs the same | Breadth-first search |
| The distance to the nearest of many places | One breadth-first search from all of them at once |
| An order for tasks with prerequisites, or whether one exists | Kahn's algorithm |
| Whether a directed graph has a cycle | Kahn's algorithm, or a depth-first search with three states |
| Groups that only ever join, with questions as they grow | Union-find |
| The cheapest path when edges cost different amounts | Dijkstra's algorithm with a heap, which is beyond this chapter |

Before you start, ask about the edges: whether edges go one way or both, whether the graph can have more than one part, whether an edge can repeat or join a node to itself, how big the graph can get, and whether you're allowed to change the input.
