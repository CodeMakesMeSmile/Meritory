# Two tickers on one tape

An old newsroom has two ticker machines that print onto one shared paper tape. Each machine prints its own message in order, one letter at a time, but the two machines take turns in no fixed pattern, so their letters mix together on the tape. Every letter of both messages lands on the tape, and nothing else does.

Given the two messages, `first` and `second`, and what's on the `tape`, return `true` if the tape could have come from the two machines, and `false` if it couldn't.

## Example

With `first = "abc"`, `second = "xay"`, and `tape = "axabyc"`, the answer is `true`: a from the first, x and a from the second, b from the first, y from the second, and c from the first.

With the same messages and `tape = "xyaabc"`, the answer is `false`. The x must come from the second machine, but then the y can't come next: the second machine prints an a before its y, and the first machine starts with an a too.

More than one choice can match the first few letters, as with the a's here, so a quick greedy reading can go wrong.

## Limits

- `first` and `second` each have from 0 to 200 lowercase letters, and `tape` has from 0 to 400. Any of them can be empty.
- If the tape's length isn't the two messages' lengths added together, the answer is `false`.
- Aim for O(n × m) time and O(m) memory, where n and m are the lengths of `first` and `second`.
- The reference solution keeps one row in loops, so it doesn't recurse.
