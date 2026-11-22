# The longest quiet stretch in the music school

A music school has several practice rooms, and the caretaker wants to polish the shared hall floor while no room is in use. Each row of `rooms` is one room's sessions, written as pairs in a single list, in minutes from midnight. So `[60, 120, 180, 200]` means in use from 60 up to 120 and from 180 up to 200. Each room's sessions are sorted and don't overlap. A row can be empty, for a room nobody booked.

A session covers its start and runs up to its end, so sessions that touch, like one ending at 120 and another starting at 120, leave no gap between them.

The school is open from `opensAt` up to `closesAt`. Return the length of the longest stretch inside those hours when no room is in use, or 0 if there isn't one. Sessions can start before opening or run past closing.

## Example

With `rooms = [[60, 120, 180, 200], [100, 150], [300, 360]]`, `opensAt = 0`, and `closesAt = 400`, some room is in use from 60 to 150, from 180 to 200, and from 300 to 360. The quiet stretches last 60, 30, 100, and 40 minutes, so the answer is 100.

## Limits

- From 0 to 50 rooms, each with 0 to 1,000 sessions.
- Each session has `0 <= start < end <= 1,440`.
- `0 <= opensAt < closesAt <= 1,440`.
- Aim for O(N log N) time, where N is the number of sessions in all.
