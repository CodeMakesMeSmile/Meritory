# Wiring the trail beacons

A park has safety beacons along its trails, and each one in `beacons` sits at a spot `[x, y]` on the park map. The beacons need to be wired into one network, so a signal can pass from any beacon to any other, through other beacons if needed.

Wire only runs north to south and east to west along the park's grid of paths, so a wire between `[x1, y1]` and `[x2, y2]` is `|x1 - x2| + |y1 - y2|` long. Wires only join at beacons. Return the least total length of wire that joins every beacon.

## Example

With `beacons = [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]`, wire `[0, 0]` to `[2, 2]` for 4, `[2, 2]` to `[5, 2]` for 3, `[5, 2]` to `[7, 0]` for 4, and `[2, 2]` to `[3, 10]` for 9. The answer is 20.

## Limits

- From 1 to 1,000 beacons, and no two share a spot.
- Each `x` and `y` is between -10,000 and 10,000.
- Any two beacons can be wired together, so aim for O(n²) time.
