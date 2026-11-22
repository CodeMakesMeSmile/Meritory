# Smallest window with every letter

Given a `text` and a string of `needed` letters, both made of the lowercase letters a to z, return the shortest stretch of `text` that holds every needed letter. Repeats count, so if `needed` is "aab", the stretch must hold at least two a's and one b. The stretch can hold other letters too.

If more than one shortest stretch works, return the one that starts first. If no stretch works, return an empty string.

## Example

With `text = "pineappletart"` and `needed = "tap"`, the stretch "pleta" holds a t, an a, and a p, and no shorter stretch does, so the answer is "pleta".

## Limits

- `text` has from 0 to 100,000 letters, and `needed` has from 1 to 100,000.
- Aim for O(n + m) time, where n and m are the lengths of `text` and `needed`.
