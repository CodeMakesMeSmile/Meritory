# Method and complexity

Every chapter after this one teaches a pattern. This one teaches the two habits the patterns sit on: a steady way to work through a coding question, and a quick way to say what a solution costs. Interviewers watch both. A correct answer reached in silence, with no idea of its cost, scores lower than you'd think.

## How a coding round runs

Most coding rounds follow the same six steps. Saying each one out loud lets the interviewer follow you and help when you drift.

1. **Clarify.** Repeat the problem in your own words, then ask about the input. How big can it get? Can values be negative, zero, or repeated? Can the input be empty? What should come back when there's no answer? Can you change the input in place?
2. **Work an example by hand.** Take the example you were given, or make a small one, and find the answer without code. This is where you find out you misread the question, before you've written anything.
3. **Say the brute force.** Describe the simplest thing that works, like checking every pair, and give its time and space. It's a fallback if you get stuck, and it's the baseline you'll improve on.
4. **Improve it.** Look for the repeated work in the brute force and ask what would remove it: sorting first, a hash map, two pointers, or a running value you carry along. Use the input limits to pick a target, as in [Growth rates and input sizes](#growth-rates-and-input-sizes). State the new cost before you code.
5. **Code it.** Use clear names, and keep talking about what each part does. If a helper is obvious, say what it does and write it last.
6. **Test it by hand.** Walk your code through a small example, then through the edge cases, as in [Testing by hand](#testing-by-hand). Fix what you find, and say the final time and space.

If you get stuck, say what you're trying and why it isn't working. That gives the interviewer something to respond to, and a small hint costs far less than a long silence.

## Big O

Big O describes how the work grows as the input grows. It ignores the exact number of steps and keeps only the shape of the growth, because the shape is what decides whether a solution survives a big input.

Two rules turn a count of steps into Big O:

- **Drop constant factors.** A loop that does 3 things per value is O(n), not O(3n). Two passes over the list are still O(n).
- **Keep only the biggest term.** n² + n + 10 is O(n²), since n² swamps the rest once n is large.

When there are two inputs, keep both. Comparing every word in one list with every word in another is O(n · m), and walking two lists one after the other is O(n + m). Don't merge them into one n, because one list may be far longer than the other.

Give the **time** and the **space**. Space means the extra memory your solution uses on top of its input, like a hash map or a copy of the list. The answer you return usually isn't counted, but say so if you leave it out. A solution that sorts in place and keeps two indices uses O(1) extra space. One that puts every value in a set uses O(n).

Unless you say otherwise, Big O means the **worst case**: the slowest the solution can be on any input of that size. Some costs are averages instead. A hash table lookup is O(1) on average, and adding to the end of a growing list is O(1) amortized, which is explained in [Amortized cost](#amortized-cost).

## Reading the cost from the code

Most of the time you can read the cost straight from the loops.

| Shape | Cost | Example |
|---|---|---|
| One loop over n values | O(n) | Summing a list |
| Two loops, one after the other | O(n + m) | Counting one list, then checking another |
| A loop inside a loop | O(n · m), or O(n²) for one list | Checking every pair |
| An inner loop that starts at i + 1 | Still O(n²) | About n² / 2 pairs, and halving is a constant |
| A loop that halves what's left | O(log n) | Binary search |
| Sorting | O(n log n) | Built-in sorts in every language here |

A loop that halves its value each time runs about log₂ n times, because that's how many halvings it takes to get from n down to 1. A million halves to 1 in 20 steps, and a billion in 30.

```ts
let rounds = 0;
while (n > 1) {
  n = Math.ceil(n / 2);
  rounds++;
}
```

Watch for costs hidden inside one line. Checking `value in list` in Python, or `list.includes(value)` in TypeScript, walks the whole list. Slicing copies every value in the slice. Building a string with `+=` in a loop copies the string each time in many languages. Each of these is O(n), so one inside a loop gives O(n²).

## Growth rates and input sizes

The limits in a question tell you how fast the answer must be. As a rough rule, a compiled language does around 100 million simple steps in a second, and Python does several times fewer. That gives these sizes, which are guides, not promises.

| Growth | Name | Largest n in about a second | Where it shows up |
|---|---|---|---|
| O(1) | Constant | Any | Reading by index, a hash lookup on average |
| O(log n) | Logarithmic | Any | Binary search, halving |
| O(n) | Linear | About 10 million | One pass |
| O(n log n) | Linearithmic | About 1 million | Sorting, a heap step for each value |
| O(n²) | Quadratic | About 5,000 | Every pair |
| O(n³) | Cubic | About 300 | Every triple |
| O(2ⁿ) | Exponential | About 20 | Every subset |
| O(n!) | Factorial | About 10 | Every ordering |

Read the table backwards in an interview. If n can be 100,000, every pair is about 5 billion steps, which is far too slow, so aim for O(n log n) or O(n). If n is at most 20, trying every subset is fine, and the question may be hinting at it.

## Amortized cost

A list that grows on its own, like a Python list, a Java `ArrayList`, or a TypeScript array, keeps its values in a block with some spare room. When the room runs out, it moves everything into a bigger block, larger than the old one by a fixed fraction. That one move is O(n).

So is adding to the end O(n)? Not over time. Count the copies across n adds, taking a block that doubles as the example: 1, then 2, then 4, and so on up to n. That adds up to less than 2n copies in total, so each add costs O(1) when you share the total out. Any fixed fraction gives the same result with a different constant. That's what **amortized** means: an average over a run of operations on the same structure, where an occasional expensive step is paid for by many cheap ones.

Amortized isn't the same as an average over inputs. A hash table lookup is O(1) on average because keys usually spread out, but a bad set of keys can make every lookup slow. An amortized cost is a promise about any run of operations, however unlucky.

The same counting shows up in later chapters. When each value is pushed onto a stack once and popped at most once, a loop with a loop inside can still be O(n) in total, because the inner loop can't pop more than was pushed.

## The cost of recursion

A recursive call has two costs to count.

**Space is the depth.** Each call that's still waiting for a smaller call keeps its own frame in memory, holding its arguments and local variables. The deepest chain of waiting calls sets the space.

```ts
function total(values: number[], i: number): number {
  if (i === values.length) return 0;
  return values[i] + total(values, i + 1);
}
```

This is O(n) time and O(n) space, because n calls are waiting at the deepest point. A loop does the same job in O(1) space. A recursion that halves its input each time is only O(log n) deep. Deep recursion can also fail outright: Python raises a `RecursionError` once the depth passes its limit, and Java throws a `StackOverflowError`. If a recursion can go 100,000 deep, use a loop or keep your own stack.

**Time is the number of calls times the work in each.** When each call makes one smaller call, that's easy. When each call makes two, the calls form a tree, and a tree with two branches at every level and depth n has about 2ⁿ calls. Draw the first few levels. If the same arguments appear on different branches, the recursion repeats work, and saving each answer the first time turns it into a loop over the different arguments. That's the idea behind the dynamic programming chapters.

## Testing by hand

Testing by hand means running your code, not your idea, on paper. Write each variable at the top of a small table, then step through the lines and update the table as the code would. It's slow on purpose. It catches the line that does something other than what you meant.

Start with a small normal example, then try the edges:

- An empty input, and an input of one value.
- All values the same, and all different.
- The answer at the very start or the very end.
- Negative numbers and zero.
- The largest values allowed, which can overflow a 32-bit int in Java and C.

Here's a bug that only an edge finds. This counts the longest run of rainy days, but it only checks the best run when a run ends.

```ts
let best = 0;
let run = 0;
for (const rainy of days) {
  if (rainy) {
    run++;
  } else {
    best = Math.max(best, run);
    run = 0;
  }
}
return best;
```

On `[true, true, false, true]` it gives 2, which is right. On `[false, true, true, true]` it gives 0, because the last run never ends inside the loop. Checking the best after the loop, or on every step, fixes it.

## Where this leads

The next chapter, arrays and hashing, is mostly about trading memory for time: an O(n) set or map that turns an O(n²) search into one pass. Binary search is where O(log n) comes from. Sorting at O(n log n) sets up the intervals and greedy chapters. Backtracking is where O(2ⁿ) and O(n!) are the honest answer, and the dynamic programming chapters fix recursions that repeat their work. The last chapter, bits and math, comes back to the limits of numbers themselves, like overflow.
