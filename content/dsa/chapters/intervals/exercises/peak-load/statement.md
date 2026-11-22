# The peak load on the generator

A summer fair runs everything from one generator. Each of the `appliances` is `[on, off, watts]`. It's switched on at the start of minute `on`, switched off at the end of minute `off`, and draws `watts` the whole time in between.

So an appliance with an `off` of 30 still draws power during minute 30, and if another has an `on` of 30, both draw power during that minute.

Return the most watts drawn during any single minute, or 0 if there are no appliances.

## Example

With `appliances = [[0, 10, 500], [5, 20, 300], [10, 15, 1000], [16, 30, 200]]`, during minute 10 the first appliance is still on as the third one starts. With the second one also on, that's 500, 300, and 1,000 watts, for 1,800. No other minute draws more, so the answer is 1,800.

## Limits

- From 0 to 100,000 appliances.
- Each has `0 <= on <= off <= 1,000,000`, so an appliance can run for a single minute.
- Each draws from 1 to 10,000 watts, so the answer fits in 32 bits.
- Aim for O(n log n) time.
