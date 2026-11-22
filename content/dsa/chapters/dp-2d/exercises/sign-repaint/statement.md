# Repainting the shop sign

A shop has a new name, and a sign painter turns the old name on the sign, `current`, into the new one, `wanted`. Each change has its own price: painting in a new letter anywhere costs `addCost`, painting out a letter costs `removeCost`, and painting over one letter with a different letter costs `repaintCost`. Letters that stay as they are cost nothing.

Return the cheapest total price to turn `current` into `wanted`.

## Example

With `current = "bakes"`, `wanted = "bikes"`, `addCost = 3`, `removeCost = 2`, and `repaintCost = 4`, painting over the a with an i costs 4. Painting out the a and painting in an i costs 2 + 3 = 5, which is more, so the answer is 4.

With the same names but `repaintCost = 6`, painting out and painting in is cheaper, and the answer is 5.

## Limits

- `current` and `wanted` each have from 0 to 500 lowercase letters. Either one can be empty.
- Each cost is from 1 to 1,000, so the answer fits in 32 bits.
- Aim for O(n × m) time and O(m) memory, where n and m are the lengths of the two names.
- The reference solution keeps two rows of the table in a loop, so it doesn't recurse.
