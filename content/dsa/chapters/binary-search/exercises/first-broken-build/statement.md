# The first broken build

A team numbers its builds from 0, and `builds[i]` is `true` if build `i` passed its tests. At some point a change broke something, and every build from then on fails. Return the number of the first build that failed, or the number of builds if none did.

Checking a build takes a long time in real life, so look at as few builds as you can.

## Example

With `builds = [true, true, true, false, false]`, the first failure is build 3.

## Limits

- Up to 100,000 builds, with every `true` before every `false`.
- Aim for O(log n) time.
