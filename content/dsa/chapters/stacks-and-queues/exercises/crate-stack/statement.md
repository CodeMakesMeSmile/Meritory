# A crate stack that knows its lightest

A warehouse loads crates onto a single stack, and the forklift can only reach the top. Build a `CrateStack` that starts empty, with these calls.

- `push(weight)` puts a crate of that weight on top.
- `pop()` takes the top crate off and returns its weight.
- `top()` returns the weight of the top crate without moving it.
- `lightest()` returns the weight of the lightest crate in the stack.

Every call should take O(1) time. `pop`, `top`, and `lightest` are only called when the stack holds at least one crate.

## Example

After `push(8)`, `push(3)`, and `push(5)`, `lightest()` returns 3. Then `pop()` returns 5 and `pop()` returns 3, and `lightest()` now returns 8.

## Limits

- Up to 100,000 calls in all.
- Each weight is between 1 and 1,000,000,000.
