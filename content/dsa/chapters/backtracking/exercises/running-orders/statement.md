# Every running order for the show

A school show has a few acts, and `acts` lists each act's number. No two acts share a number. Before they pick a running order, the organisers want to see every order the acts could go on stage in.

Return every order, each as a list of all the act numbers from first on stage to last. Return the orders in any order.

## Example

With `acts = [1, 2, 3]`, there are six orders: `[1, 2, 3]`, `[1, 3, 2]`, `[2, 1, 3]`, `[2, 3, 1]`, `[3, 1, 2]`, and `[3, 2, 1]`.

## Limits

- From 0 to 7 acts, so there are at most 5,040 orders. With no acts, there's one order, the empty one.
- Each act number is between 1 and 100, and no two are the same.
- The recursion is at most 8 calls deep, so a recursive answer is safe in every language.
- Aim for O(n × n!) time.
