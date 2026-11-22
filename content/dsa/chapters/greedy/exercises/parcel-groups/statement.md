# Split the parcel line into groups

Parcels come down a conveyor in a line, and each one is labelled with a lowercase letter for the van it goes on. The line gets cut into groups of parcels that sit next to each other, so that all the parcels for any one van end up in the same group.

Make as many groups as possible, and return their sizes from the front of the line to the back.

## Example

With `labels = "abacdcdeffe"`, the last parcel for van a is at position 2, so the first group has to reach that far, and van b's parcel is inside it. That's a group of 3. Vans c and d reach position 6, a group of 4, and vans e and f fill the last 4. The answer is `[3, 4, 4]`.

## Limits

- From 1 to 100,000 parcels.
- Every label is a lowercase letter from a to z.
- Aim for O(n) time.
