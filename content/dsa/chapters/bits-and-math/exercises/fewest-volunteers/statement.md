# Fewest volunteers for every job

A community garden has up to 20 kinds of job, numbered from 0. The jobs it needs done this weekend are the 1 bits of `needed`, so bit j is 1 when job j is needed. Each volunteer's `skills[i]` is written the same way, with bit j set when volunteer i can do job j.

Return the fewest volunteers who, between them, can do every needed job. If no group can, return -1. If no jobs are needed, no volunteers are either, so return 0.

## Example

With `skills = [3, 4, 6]` and `needed = 7`, the jobs needed are 0, 1, and 2. Volunteer 0 can do jobs 0 and 1, volunteer 1 can do job 2, and volunteer 2 can do jobs 1 and 2. Volunteers 0 and 1 together cover all three, and no one covers them alone, so the answer is 2.

## Limits

- From 0 to 15 volunteers.
- Each `skills[i]` and `needed` is from 0 to 1,048,575, which is 20 bits.
- Try every group as a bitmask. Combine a group's skills with OR, and check the cover with AND.
