# Turn a run of train cars

A model railway stores a train as a linked list of car numbers, from the engine end. `train` is the first car. A turntable in the yard can take a run of cars and send it back in reverse order.

Reverse the cars from position `first` to position `last`, counting from 1, and leave every other car where it is. Change the pointers rather than the numbers, and return the train's first car afterward.

## Example

With `train = 10 -> 20 -> 30 -> 40 -> 50`, `first = 2`, and `last = 4`, the run `20 -> 30 -> 40` turns around, so the train becomes `10 -> 40 -> 30 -> 20 -> 50`.

When `first` is 1, the train starts with a different car afterward.

## Limits

- From 1 to 100,000 cars, each numbered between 1 and 1,000,000.
- `1 <= first <= last <=` the number of cars.
- The reference solution walks the list with loops, since that's too deep for one recursive call per car.
- Aim for one pass, O(n) time, and O(1) extra memory.
