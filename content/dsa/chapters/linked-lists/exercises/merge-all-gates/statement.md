# Every gate in one list

A museum has several ticket gates. Each gate logs its entry times as a linked list of minutes after midnight, sorted from earliest to latest, and `gates` holds the first node of each gate's list. A gate with no visitors has an empty list.

Merge every gate's list into one list sorted from earliest to latest, by relinking the nodes you're given, and return its first node.

## Example

With these three gates:

- `540 -> 600 -> 720`
- `550 -> 610`
- `530 -> 700 -> 800`

the merged list is `530 -> 540 -> 550 -> 600 -> 610 -> 700 -> 720 -> 800`.

## Limits

- From 0 to 1,000 gates, with up to 100,000 entry times in all, each between 0 and 1,439.
- Aim for O(N log k) time, where N is the number of entry times and k is the number of gates.
