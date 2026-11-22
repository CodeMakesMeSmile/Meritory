# The shortest wait at the bike shop

A bike shop has one mechanic and a queue of customers who all arrived when it opened. Customer `i`'s repair takes `repairs[i]` minutes, and each customer waits from opening time until their own repair is done. The mechanic works on one repair at a time with no breaks, and can take them in any order.

Return the least total waiting time across all the customers.

## Example

With `repairs = [10, 3, 6]`, doing the 3 minute repair first, then the 6, then the 10 finishes them at minutes 3, 9, and 19. That's 31 minutes of waiting in all, and no other order waits less. The answer is 31.

## Limits

- From 0 to 100,000 customers.
- Each repair takes between 1 and 10,000 minutes.
- The answer can be too big for 32 bits, so it's a 64-bit number.
- Aim for O(n log n) time.
