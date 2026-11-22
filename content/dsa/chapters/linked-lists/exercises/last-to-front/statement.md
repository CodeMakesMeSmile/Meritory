# The last cards to the front

A flashcard app keeps a deck as a linked list of card numbers, with `cards` as the top card. To bring recent cards back into view, it moves the last `k` cards to the top, keeping their order.

Relink the deck so the last `k` cards come first, followed by the rest in their old order, and return the new top card.

## Example

With `cards = 1 -> 2 -> 3 -> 4 -> 5` and `k = 2`, the last two cards are 4 and 5, so the deck becomes `4 -> 5 -> 1 -> 2 -> 3`.

When `k` is 0, or the number of cards, the deck stays as it was.

## Limits

- From 0 to 100,000 cards, each numbered between 1 and 1,000,000. Numbers can repeat.
- `k` is between 0 and the number of cards.
- Aim for one pass over the list, without counting it first, and O(1) extra memory.
