# Trees and binary search trees

A binary tree is a set of nodes where each node has a value and up to two children, a left one and a right one. The node at the top is the root. A node with no children is a leaf. Every node except the root has exactly one parent, so there's exactly one path from the root to any node.

In this chapter a node looks like this. The code runner gives you the class, so you don't write it yourself.

```ts
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
```

A tree's **depth** at a node is how many steps it is from the root. Its **height** is the number of levels, so a single node has height 1 and an empty tree has height 0. Some books count edges instead of nodes, so check which one a question means.

## How the cases write a tree

The cases write a tree as a list in level order: the root, then the next level from left to right, and so on. A missing child is `null`, and nulls at the very end are left off. Children are only listed for nodes that exist, so a missing node takes up one place, and its children take up none.

```text
[5, 3, 8, 1, null, 7, 9]

        5
       / \
      3   8
     /   / \
    1   7   9
```

Read it two at a time after the root. 3 and 8 are the children of 5. 1 and `null` are the children of 3. 7 and 9 are the children of 8. An empty tree is `[]`.

## Depth-first orders

A depth-first walk goes all the way down one branch before coming back for the next. Recursion fits it, because each child is a smaller tree of the same shape. The three orders differ only in when you visit the node itself.

```ts
function walk(node: TreeNode | null, out: number[]): void {
  if (!node) return;
  out.push(node.val); // preorder: before the children
  walk(node.left, out);
  // inorder would push here, between the children
  walk(node.right, out);
  // postorder would push here, after the children
}
```

| Order | Visits the node | Good for |
|---|---|---|
| Preorder | Before its children | Copying or writing out a tree, since a parent comes before what hangs off it |
| Inorder | Between its left and right children | Reading a binary search tree in sorted order |
| Postorder | After both children | Anything that needs the children's answers first, like sizes, heights, or deleting a tree |

For the tree above, preorder is 5, 3, 1, 8, 7, 9. Inorder is 1, 3, 5, 7, 8, 9. Postorder is 1, 3, 7, 9, 8, 5.

Each walk visits every node once, so it's O(n) time. The recursion uses one stack frame per level, so the memory is O(h), where h is the height. That's O(log n) for a balanced tree and O(n) for a tree that's one long chain. Python stops at about 1,000 nested calls by default, so a deep chain needs an explicit stack instead of recursion. The exercises in this chapter keep trees at most 500 levels deep, so recursion is safe in every language.

## Returning values up

Many questions about a tree are answered by asking each child the same question and combining the answers. The answer for a leaf is easy, and every node waits for its children, which is postorder.

The height is one more than the taller child's height:

```ts
function height(node: TreeNode | null): number {
  if (!node) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}
```

**Balance.** A tree is height-balanced when, at every node, the two children's heights differ by at most 1. Calling `height` from every node repeats the same work and costs O(n²) on a chain. Instead, return the height and the verdict in one pass. A common trick is to return -1 for "not balanced", since no real height is negative, and pass the -1 straight up once it appears.

**Diameter.** The longest path between any two nodes, counted in edges, might not go through the root. At each node, the longest path that bends there goes down the left side as far as it can and down the right side as far as it can, which is `height(left) + height(right)` edges. So the function returns the height to its parent, and keeps the best bend seen so far in a variable outside the recursion.

```ts
let best = 0;
function depth(node: TreeNode | null): number {
  if (!node) return 0;
  const left = depth(node.left);
  const right = depth(node.right);
  best = Math.max(best, left + right);
  return 1 + Math.max(left, right);
}
```

The value returned and the value recorded are different things. A parent can only extend a path that goes down **one** side, so the return is the taller side. The bend through both sides is only a candidate answer. The best path sum with negative values works the same way: each node returns its value plus the better child's gain, treating a negative gain as 0, and records its value plus both gains as a candidate.

## Passing state down

Some questions are about the path from the root to a node, like "what's the running total so far?" or "what's the highest value above this node?". Those go the other way: each call passes what it knows down to its children as an argument.

```ts
function hasTotal(node: TreeNode | null, target: number, sum: number): boolean {
  if (!node) return false;
  const total = sum + node.val;
  if (!node.left && !node.right) return total === target;
  return hasTotal(node.left, target, total) || hasTotal(node.right, target, total);
}
```

Each call gets its own copy of `sum`, so there's nothing to undo when a branch is done. Check the leaf condition carefully. A node with one child isn't a leaf, so a running total that happens to match there doesn't count. And don't stop early when the total passes the target unless the question promises every value is positive.

The best value so far on the path is the same idea. To count nodes that are at least as high as everything above them, pass down the highest value seen on the way, compare, and pass down the new highest.

## Level order with a queue

To visit a tree one level at a time, use a queue, as in a breadth-first search. Put the root in. To finish one level, note how many nodes are in the queue now, take exactly that many out, and add their children. Everything added during that loop is the next level.

```ts
const levels: number[][] = [];
const queue: TreeNode[] = root ? [root] : [];
let head = 0;
while (head < queue.length) {
  const size = queue.length - head;
  const level: number[] = [];
  for (let i = 0; i < size; i++) {
    const node = queue[head++];
    level.push(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  levels.push(level);
}
```

Counting the level's size first is what keeps levels apart. Without it, children join the same loop as their parents.

Level order answers questions about each level: the widest level, the average of each level, or what you'd see standing to the right of the tree. That last one is the last node of each level. It's not just the right edge of the tree, because a deep left branch can stick out below a short right one.

## Binary search trees

A binary search tree, or BST, keeps one rule at every node: every value in the left subtree is smaller than the node, and every value in the right subtree is bigger. That rule turns a search into a walk down one path. At each node, go left if the target is smaller and right if it's bigger, so a lookup is O(h), and O(log n) when the tree is balanced.

Because smaller values sit to the left, an inorder walk of a BST visits the values in sorted order.

**Checking the rule.** Comparing each node only with its own children isn't enough. In this tree every parent and child pair looks fine, but 9 sits in the left subtree of 8, so it breaks the rule.

```text
        8
       / \
      4   12
       \
        9
```

Pass bounds down instead. Every node must sit strictly between a lowest and a highest allowed value. Going left, the node's value becomes the new upper bound. Going right, it becomes the new lower bound.

```ts
function valid(node: TreeNode | null, low: number | null, high: number | null): boolean {
  if (!node) return true;
  if (low !== null && node.val <= low) return false;
  if (high !== null && node.val >= high) return false;
  return valid(node.left, low, node.val) && valid(node.right, node.val, high);
}
```

Use `null`, or a wider type, for "no bound yet". Starting with the smallest and largest 32-bit numbers fails when a node holds exactly one of them. Checking that the inorder walk only goes up works too.

**Skipping branches.** The same rule lets you skip whole subtrees. To total the values between `low` and `high`, a node below `low` can only have useful values on its right, and a node above `high` only on its left.

## The lowest common ancestor

The lowest common ancestor of two nodes is the deepest node that has both of them below it, where a node counts as below itself. It's where the paths from the root to the two nodes split.

**In a BST**, walk down from the root. If both values are smaller than the node, the split is to the left. If both are bigger, it's to the right. Otherwise they go different ways here, or one of them is this node, so this node is the answer. That's O(h) with no recursion at all.

**In a plain binary tree**, there's no order to follow, so look everywhere. Ask each subtree whether it holds either node, and return what it found up the tree.

```ts
function lowest(node: TreeNode | null, a: number, b: number): TreeNode | null {
  if (!node || node.val === a || node.val === b) return node;
  const left = lowest(node.left, a, b);
  const right = lowest(node.right, a, b);
  if (left && right) return node;
  return left ?? right;
}
```

If one target turns up on each side, this node is where they split. If only one side found anything, pass it up. When one target is above the other, the search stops at the upper one and returns it, which is right, because the upper one is the ancestor. This relies on both values being in the tree, so ask about that.

## Building and writing out trees

One traversal alone can't rebuild a tree. The trees `1` with a left child `2`, and `1` with a right child `2`, both have the preorder 1, 2. Two orders together can, when the values are all different.

**Preorder and inorder.** The first value in preorder is the root. Find it in the inorder list: everything before it is the left subtree, and everything after it is the right. That also says how many values belong to each side, so the next values in preorder are the left subtree, then the right. Build each side the same way. Looking up each root's position with a map instead of a scan keeps it O(n).

**Writing a tree out.** To turn a tree into text that can be read back, write it in preorder and mark every missing child, for example with `#`. The markers are what make one list enough: they say exactly where each branch ends. Reading it back walks the list in the same preorder, making a node for each value and returning null for each `#`.

```text
[1, 2, 3, null, null, 4, 5]  is written as  1,2,#,#,3,4,#,#,5,#,#
```

Before you start, ask about the edges: an empty tree, a single node, a tree that's one long chain, values that repeat or are negative, and how deep the tree can get.
