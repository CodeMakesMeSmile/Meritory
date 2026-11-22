# Cancel a job near the end

A shared printer keeps its waiting jobs as a linked list of job numbers, with `jobs` as the job that prints next. Someone asks to cancel the job that's `n`th from the end of the queue, where `n = 1` is the last job.

Remove that job from the list and return the job that prints next afterward.

## Example

With `jobs = 11 -> 22 -> 33 -> 44 -> 55` and `n = 2`, the job second from the end is 44, so the queue becomes `11 -> 22 -> 33 -> 55`.

With `n = 5`, the job to cancel is the first one, so the queue starts with 22 afterward.

## Limits

- From 1 to 100,000 jobs, each numbered between 1 and 1,000,000. Numbers can repeat.
- `n` is between 1 and the number of jobs.
- Aim for one pass over the list, without counting it first, and O(1) extra memory.
