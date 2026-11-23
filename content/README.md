# Curriculum

Questions, answer keys, rubrics, recall prompts, role packs, and AI evaluation prompts go here.

Everything in this folder is all rights reserved and is not covered by the AGPL. See [LICENSE-CONTENT.md](../LICENSE-CONTENT.md).

Synthetic seed data for local development and tests should live with the code, not here, so a fresh clone runs without any of this material.

Write everything in our own words. Course notes and other outside material are for reference only, and nothing is copied from them. `resources/` holds that private reference material and is never committed.

This guide covers every file in a track. The examples below build one small track, and a test builds them on every pull request, so each one passes the content check as written.

- [Add a chapter](#add-a-chapter)
- [Layout](#layout)
- [Rules for every file](#rules-for-every-file)
- [Track](#track)
- [Chapter](#chapter)
- [Explanation](#explanation)
- [Cards](#cards)
- [Rubrics](#rubrics)
- [Exercises](#exercises)
- [Coding exercises](#coding-exercises)
- [Design exercises](#design-exercises)
- [Versions](#versions)
- [Private tracks](#private-tracks)
- [Stack decisions facts](#stack-decisions-facts)
- [Commands](#commands)

## Add a chapter

You need the repo running locally, as described in [CONTRIBUTING.md](../CONTRIBUTING.md), and a track with a `track.yaml`.

1. Make a folder in `chapters/` named with the chapter's id.
2. Write `chapter.yaml` with the chapter's title, its order in the track, and the skills it teaches.
3. Write `explanation.md`, the text a learner reads first.
4. Write `cards.yaml`. Give every skill at least one card that asks why or when.
5. Optional: add exercises in pairs of siblings under `exercises/`, each naming a rubric from the track's `rubrics/` folder.
6. To record hashes for new cases and versions for new or changed items, run `pnpm content:lock`.
7. To check the whole track and build the bundle, run `pnpm content:build`. Fix each problem it prints at its file and line, then run it again until it passes.

Commit the chapter with the `cases.lock.json` and `versions.json` changes that `pnpm content:lock` made.

## Layout

```text
content/
  dsa/
    track.yaml
    versions.json
    rubrics/
      coding-practice.yaml
      design-review.yaml
    chapters/
      prefix-sums/
        chapter.yaml
        explanation.md
        cards.yaml
        exercises/
          running-sum/
            exercise.yaml
            statement.md
            cases.json
            cases.lock.json
            solutions/
              solution.ts
              solution.py
              Solution.java
              solution.c
          view-counter/
            exercise.yaml
            statement.md
            answer.md
  stack-decisions/
    categories.yaml
    facts/
      code-hosting.yaml
  resources/
```

A folder is a track once it has a `chapters/` folder with a chapter in it. Tracks without chapters are still checked, but they're left out of the bundle.

## Rules for every file

- **Ids** are lowercase words joined by hyphens, like `prefix-sums`, up to 80 characters. A track's id matches its folder, a chapter's and an exercise's match theirs, and a rubric's matches its file name.
- **Unique in a track**: chapter ids, chapter orders, skill ids, card ids, exercise ids, and case uuids.
- **YAML** is read as YAML 1.2, and a file that starts with a `%YAML 1.1` directive is refused, because 1.1 turns values like `no` into false.
- **Text** can hold any character except control characters. Tab and newline are fine.
- **Markdown** is CommonMark. It can't hold raw HTML, and links and images must start with `https://` or `#`. Explanations, statements, model answers, rubric levels, and every card field except `id`, `skill`, `asks`, `type`, `title`, `term`, `matchHeading`, `matchName`, and `url` are Markdown.
- **Unknown fields** are refused, so a typo in a field name is caught.

## Track

`content/dsa/track.yaml`

```yaml
id: dsa
title: Data structures and algorithms
```

| Field | Rule |
|---|---|
| `id` | Matches the folder name |
| `title` | Text, up to 80 characters |

## Chapter

`content/dsa/chapters/prefix-sums/chapter.yaml`

```yaml
id: prefix-sums
title: Prefix sums
order: 1
skills:
  - id: build-prefix-sums
    name: Build a prefix sum array
  - id: answer-range-sums
    name: Answer a range sum from prefix sums
```

| Field | Rule |
|---|---|
| `id` | Matches the folder name |
| `title` | Text, up to 120 characters |
| `order` | Where the chapter sits in the track, from 1 to 999, and unique in the track |
| `skills` | At least one, each with an `id` and a `name` of up to 120 characters |
| `prerequisites` | Optional. Ids of chapters in the same track to finish first. A chapter can't list itself, and prerequisites can't go in a circle. |

## Explanation

`content/dsa/chapters/prefix-sums/explanation.md`

````markdown
# Prefix sums

A prefix sum array holds, at each index, the total of every value before it. Once it's built, the sum of any range is one subtraction, as shown in [Answering a range](#answering-a-range).

## Building it

Start with 0, then add each value to the last total. That takes one pass over the input.

## Answering a range

```ts
const sum = prefix[right + 1] - prefix[left];
```
````

The explanation can't be empty, and it follows the Markdown rules.

## Cards

`cards.yaml` is a list of recall cards in four types.

`content/dsa/chapters/prefix-sums/cards.yaml`

```yaml
- id: why-one-pass
  skill: build-prefix-sums
  asks: why
  type: prompt
  prompt: Why does building a prefix sum array take only one pass?
  reworded: What lets you fill a prefix sum array without going back?
  points:
    - Each total is the previous total plus one new value.
    - No earlier value has to be read twice.
  misconception: That each total needs its own loop over the values before it.
  lesson:
    title: Each total builds on the last
    explanation: The total at index i is the total at i - 1 plus the value at i, so one loop fills the array.
    fix: Keep the last total in a variable and add one value to it at each step.
- id: range-sum-steps
  skill: answer-range-sums
  asks: what
  type: ordering
  prompt: Put the steps for answering a range sum in order.
  reworded: In what order do you answer a range sum query?
  steps:
    - Build the prefix array with a leading 0.
    - Read the total just past the right end.
    - Subtract the total at the left end.
  terms:
    - term: Prefix array
      definition: The running totals, with 0 at index 0.
  lesson:
    title: One subtraction per query
    explanation: The total past the right end minus the total at the left end leaves only the range.
- id: when-prefix-sums
  skill: answer-range-sums
  asks: when
  type: matching
  prompt: Match each problem to what fits it best.
  reworded: Which approach suits each of these problems?
  matchHeading: Approaches
  matchName: an approach
  pairs:
    - item: Many range sum queries on a list that never changes
      match: Prefix sums
    - item: One range sum on a list you read once
      match: A single loop
  extraMatches:
    - Sorting first
  lesson:
    title: Prefix sums pay off over many queries
    explanation: Building the array costs one pass, so it only helps when many queries share it.
- id: why-leading-zero
  skill: build-prefix-sums
  asks: why
  type: pick-one
  prompt: Why does the prefix array start with a 0?
  reworded: What is the 0 at the front of the prefix array for?
  options:
    - text: So a range that starts at index 0 needs no special case
      correct: true
      reason: The total before index 0 is 0, so the same subtraction works for every range.
    - text: So the array is easier to sort
      reason: Prefix arrays are never sorted.
  lesson:
    title: The empty prefix
    explanation: The 0 is the total of no values, which is what comes before index 0.
```

Every card has these fields.

| Field | Rule |
|---|---|
| `id` | Unique in the track |
| `skill` | A skill from this chapter |
| `asks` | `what`, `why`, or `when`. Every skill needs at least one card that asks `why` or `when`. |
| `type` | `prompt`, `ordering`, `matching`, or `pick-one` |
| `prompt` | Markdown, up to 2,000 characters |
| `reworded` | The same question in other words, for the retry after a miss. It can't match `prompt`, ignoring case and spacing. |
| `misconception` | Optional. Markdown, up to 1,000 characters |
| `lesson` | What a learner sees after a miss: a `title` of up to 120 characters and an `explanation`, plus optional `happened`, `fix`, and `source`. Each Markdown field holds up to 3,000 characters. |

A `source` has an `https://` `url` with no `@` before its path, and a `title` of up to 200 characters.

Each type adds its own fields.

| Type | Fields |
|---|---|
| `prompt` | `points`: 1 to 8 things a good answer covers, shown on reveal, up to 500 characters each |
| `ordering` | `steps`: 3 to 10 steps in the right order, shuffled when shown, up to 300 characters each and none repeated. Optional `terms`: up to 10, each a `term` and its `definition`. |
| `matching` | `pairs`: 2 to 6, each an `item` and its `match`. Optional `extraMatches`: up to 4 wrong matches. `matchHeading`: the name above the matches, up to 40 characters. `matchName`: one match with its article, as it reads mid-sentence, such as `a cost` or `an approach`, up to 40 characters. It must start with `a` or `an`. The hints use it, as in "Now pick a cost" and "Tap a box, then the cost that goes in it." No item or match can repeat. |
| `pick-one` | `options`: 2 to 6, each with `text`, a `reason` shown after the answer, and `correct: true` on exactly one. No option can repeat. |

## Rubrics

Rubrics live in the track's `rubrics/` folder, and each exercise names one. Every criterion is scored from 1 to 4.

`content/dsa/rubrics/coding-practice.yaml`

```yaml
id: coding-practice
title: Coding practice
criteria:
  - id: correctness
    name: Correctness
    scoredBy: tests
    levels:
      - Fails most cases.
      - Passes the common cases but misses edge cases.
      - Fails one or two cases.
      - Passes every case.
  - id: complexity
    name: Time and space
    scoredBy: self
    levels:
      - Can't say how the time grows.
      - States the time but not the space.
      - States both, with one mistake.
      - States both correctly and names the trade-off.
pass:
  total: 6
  lowest: 2
```

`content/dsa/rubrics/design-review.yaml`

```yaml
id: design-review
title: Design review
criteria:
  - id: requirements
    name: Requirements
    scoredBy: self
    levels:
      - Starts designing without asking what's needed.
      - Lists some requirements but misses the main one.
      - Covers the main requirements.
      - Covers them and says which matter most.
  - id: trade-offs
    name: Trade-offs
    scoredBy: self
    levels:
      - Names no alternatives.
      - Names an alternative without comparing it.
      - Compares one alternative on cost or speed.
      - Compares alternatives and explains the choice.
pass:
  total: 6
  lowest: 2
```

| Field | Rule |
|---|---|
| `id` | Matches the file name |
| `title` | Text, up to 120 characters |
| `criteria` | 1 to 10, each with an `id` unique in the rubric, a `name` of up to 80 characters, `scoredBy`, and `levels` |
| `scoredBy` | `tests` when the code runner scores it, or `self` when the learner does |
| `levels` | Exactly 4, written from level 1 up, each Markdown of up to 500 characters and not empty |
| `pass.total` | The lowest total that passes, from 1 up to 4 times the number of criteria |
| `pass.lowest` | The lowest level any one criterion can score in a pass, from 1 to 4 |

## Exercises

Each exercise is a folder in its chapter's `exercises/` folder, with `exercise.yaml` and `statement.md`. Exercises come in pairs of siblings: two exercises of the same kind in the same chapter that test the same skills in different settings, each naming the other.

| Field | Rule |
|---|---|
| `id` | Matches the folder name, and unique in the track |
| `kind` | `coding` or `design` |
| `title` | Text, up to 120 characters |
| `difficulty` | `easy`, `medium`, or `hard` |
| `skills` | At least one skill from this chapter |
| `sibling` | The other exercise in the pair. It must name this one back and be the same kind. |
| `rubric` | A rubric in this track. A coding exercise's rubric needs at least one criterion scored by tests, and a design exercise's can't have any. |
| `requires` | Optional. Criteria from the rubric that must reach level 3 to pass, each listed once |
| `signature` | Coding exercises only. See below. |

`statement.md` is what the learner is asked to do, and it follows the Markdown rules.

## Coding exercises

A coding exercise also has `cases.json`, `cases.lock.json`, and a `solutions/` folder.

### Signatures

A function signature names the function, its parameters, and what it returns.

`content/dsa/chapters/prefix-sums/exercises/running-sum/exercise.yaml`

```yaml
id: running-sum
kind: coding
title: Running sum
difficulty: easy
skills:
  - build-prefix-sums
sibling: range-sum
rubric: coding-practice
requires:
  - correctness
signature:
  function: runningSum
  params:
    - name: nums
      type: int[]
  returns: int[]
```

`content/dsa/chapters/prefix-sums/exercises/running-sum/statement.md`

```markdown
# Running sum

Given a list of numbers, return a list where each value is the sum of every number up to and including that index.
```

A class signature is for a problem tested by calls on one object. Its `params` are what the constructor takes.

`content/dsa/chapters/prefix-sums/exercises/range-sum/exercise.yaml`

```yaml
id: range-sum
kind: coding
title: Range sum queries
difficulty: medium
skills:
  - build-prefix-sums
  - answer-range-sums
sibling: running-sum
rubric: coding-practice
signature:
  class: RangeSum
  params:
    - name: nums
      type: int[]
  methods:
    - name: sumRange
      params:
        - name: left
          type: int
        - name: right
          type: int
      returns: int
```

`content/dsa/chapters/prefix-sums/exercises/range-sum/statement.md`

```markdown
# Range sum queries

Build a `RangeSum` from a list of numbers. Then `sumRange(left, right)` returns the sum of the numbers from index `left` to index `right`, inclusive, and it should be fast for many calls.
```

| Field | Rule |
|---|---|
| `function` | camelCase, up to 40 characters |
| `class` | PascalCase, up to 40 characters |
| `params` | For a function, 1 to 8. For a constructor or a method, up to 8. Each has a camelCase `name`, unique in its list, and a `type`. |
| `hidden` | Optional on a function's parameter. It sets up the input but isn't passed in, like where a list's cycle starts. |
| `returns` | A type, or `void` |
| `checks` | Required when a function returns `void`, and only then. It names the parameter whose final value is checked, which can't be hidden. |
| `anyOrder` | Optional on a function. The answer is a list whose order doesn't matter. |
| `methods` | 1 to 12, each with a unique camelCase `name`, `params`, and `returns` |

Types are `int`, `long`, `double`, `boolean`, `char`, `string`, `ListNode`, and `TreeNode`, each with up to two `[]` for lists, like `int[][]`.

| Type | Written in JSON as |
|---|---|
| `int` | A whole number that fits in 32 bits |
| `long` | A whole number up to 2^53 - 1 either way, since JSON loses digits past that |
| `double` | Any finite number. Answers match within 0.00001. |
| `boolean` | `true` or `false` |
| `char` | A string of one ASCII character |
| `string` | A string |
| `ListNode` | A list of ints, from the head |
| `TreeNode` | A list of ints in level order, with `null` for a missing child. The root can't be `null`. |

### Cases

`cases.json` follows [Exercism's canonical data format](https://github.com/exercism/problem-specifications). Cases can sit in groups, which have a `description` and their own `cases`.

`content/dsa/chapters/prefix-sums/exercises/running-sum/cases.json`

```json
{
  "exercise": "running-sum",
  "cases": [
    {
      "uuid": "9373a0b3-110c-4051-a269-85590dbdaea2",
      "description": "adds each number to the ones before it",
      "property": "runningSum",
      "input": { "nums": [1, 2, 3, 4] },
      "expected": [1, 3, 6, 10]
    },
    {
      "description": "edge cases",
      "cases": [
        {
          "uuid": "5e943a73-6c25-499e-aa3b-e322a49ce55c",
          "description": "an empty list has no sums",
          "property": "runningSum",
          "input": { "nums": [] },
          "expected": []
        },
        {
          "uuid": "6cc039bd-464c-47af-8d60-1243aed909c4",
          "description": "negative numbers lower the sum",
          "property": "runningSum",
          "input": { "nums": [3, -5, 2] },
          "expected": [3, -2, 0]
        }
      ]
    }
  ]
}
```

A class's cases list the calls in order, starting with the constructor, and the arguments for each. `expected` has one value per call, with `null` for the constructor and for methods that return `void`.

`content/dsa/chapters/prefix-sums/exercises/range-sum/cases.json`

```json
{
  "exercise": "range-sum",
  "cases": [
    {
      "uuid": "da0fe180-cfbf-4239-8166-8683c4669c74",
      "description": "answers ranges at the start, middle, and end",
      "property": "RangeSum",
      "input": {
        "calls": ["RangeSum", "sumRange", "sumRange", "sumRange"],
        "args": [[[1, 2, 3, 4]], [0, 1], [1, 2], [2, 3]]
      },
      "expected": [null, 3, 5, 7]
    },
    {
      "uuid": "94897c1e-1a6b-4baa-aa13-f69e49991aac",
      "description": "a range of one number is that number",
      "property": "RangeSum",
      "input": {
        "calls": ["RangeSum", "sumRange"],
        "args": [[[5, -1]], [1, 1]]
      },
      "expected": [null, -1]
    }
  ]
}
```

| Field | Rule |
|---|---|
| `exercise` | The exercise's id |
| `uuid` | A lowercase version 4 uuid, unique in the track. Make one with `node -p "crypto.randomUUID()"`. |
| `description` | Text, up to 200 characters |
| `property` | The function or class name |
| `input` | For a function, every parameter by name. For a class, `calls` and `args`, two lists of the same length. |
| `expected` | A value of the return type, or of the `checks` parameter's type when the function returns `void`. Use `{ "error": "..." }` when the input must be refused. |
| `reimplements` | Optional. The uuid of an earlier case in this file that this one fixes |
| `comments` | Optional. A list of notes, up to 500 characters each |

### Locked cases never change

`pnpm content:lock` writes each new case's hash to `cases.lock.json`. The hash covers `property`, `input`, and `expected`, so editing a `description` or `comments` is fine. Once a case is locked:

- Don't change what it tests. The check fails if you do.
- Don't remove it. The check fails if you do.
- To fix a wrong case, leave it in the file and add a new case with a new uuid and `reimplements` set to the old case's uuid.

Never edit `cases.lock.json` by hand.

### Reference solutions

Each coding exercise has a reference solution in `solutions/` for every language: `solution.ts`, `solution.py`, `Solution.java`, and `solution.c`. None of them can be empty. They stay in the repo for the code runner and are never sent to learners.

<details>
<summary>Reference solutions for both exercises</summary>

`content/dsa/chapters/prefix-sums/exercises/running-sum/solutions/solution.ts`

```ts
export function runningSum(nums: number[]): number[] {
  const sums: number[] = [];
  let total = 0;
  for (const num of nums) {
    total += num;
    sums.push(total);
  }
  return sums;
}
```

`content/dsa/chapters/prefix-sums/exercises/running-sum/solutions/solution.py`

```python
class Solution:
    def runningSum(self, nums: list[int]) -> list[int]:
        sums = []
        total = 0
        for num in nums:
            total += num
            sums.append(total)
        return sums
```

`content/dsa/chapters/prefix-sums/exercises/running-sum/solutions/Solution.java`

```java
class Solution {
    public int[] runningSum(int[] nums) {
        int[] sums = new int[nums.length];
        int total = 0;
        for (int i = 0; i < nums.length; i++) {
            total += nums[i];
            sums[i] = total;
        }
        return sums;
    }
}
```

`content/dsa/chapters/prefix-sums/exercises/running-sum/solutions/solution.c`

```c
#include <stdlib.h>

int* runningSum(int* nums, int numsSize, int* returnSize) {
    int* sums = malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));
    int total = 0;
    for (int i = 0; i < numsSize; i++) {
        total += nums[i];
        sums[i] = total;
    }
    *returnSize = numsSize;
    return sums;
}
```

`content/dsa/chapters/prefix-sums/exercises/range-sum/solutions/solution.ts`

```ts
export class RangeSum {
  private prefix: number[] = [0];

  constructor(nums: number[]) {
    for (const num of nums) {
      this.prefix.push(this.prefix[this.prefix.length - 1] + num);
    }
  }

  sumRange(left: number, right: number): number {
    return this.prefix[right + 1] - this.prefix[left];
  }
}
```

`content/dsa/chapters/prefix-sums/exercises/range-sum/solutions/solution.py`

```python
class RangeSum:
    def __init__(self, nums: list[int]):
        self.prefix = [0]
        for num in nums:
            self.prefix.append(self.prefix[-1] + num)

    def sumRange(self, left: int, right: int) -> int:
        return self.prefix[right + 1] - self.prefix[left]
```

`content/dsa/chapters/prefix-sums/exercises/range-sum/solutions/Solution.java`

```java
class RangeSum {
    private final int[] prefix;

    public RangeSum(int[] nums) {
        prefix = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
    }

    public int sumRange(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
}
```

`content/dsa/chapters/prefix-sums/exercises/range-sum/solutions/solution.c`

```c
#include <stdlib.h>

typedef struct {
    int* prefix;
} RangeSum;

RangeSum* rangeSumCreate(int* nums, int numsSize) {
    RangeSum* obj = malloc(sizeof(RangeSum));
    obj->prefix = malloc(sizeof(int) * (numsSize + 1));
    obj->prefix[0] = 0;
    for (int i = 0; i < numsSize; i++) {
        obj->prefix[i + 1] = obj->prefix[i] + nums[i];
    }
    return obj;
}

int rangeSumSumRange(RangeSum* obj, int left, int right) {
    return obj->prefix[right + 1] - obj->prefix[left];
}

void rangeSumFree(RangeSum* obj) {
    free(obj->prefix);
    free(obj);
}
```

</details>

## Design exercises

A design exercise has no signature, cases, lock file, or solutions. Instead it has `answer.md`, a model answer the learner sees after scoring themselves against the rubric.

`content/dsa/chapters/prefix-sums/exercises/view-counter/exercise.yaml`

```yaml
id: view-counter
kind: design
title: Page views between two days
difficulty: medium
skills:
  - answer-range-sums
sibling: step-tracker
rubric: design-review
```

`content/dsa/chapters/prefix-sums/exercises/view-counter/statement.md`

```markdown
# Page views between two days

A site records how many times a page is viewed each day. Design a way to answer "how many views between day a and day b?" quickly, many times a second.
```

`content/dsa/chapters/prefix-sums/exercises/view-counter/answer.md`

```markdown
# Model answer

Keep a running total of views for each day. A query is the total at day b minus the total the day before a, so it takes the same time for any range.

Today's count still changes, so add it to the total when the day ends, and answer ranges that include today from the live count.
```

`content/dsa/chapters/prefix-sums/exercises/step-tracker/exercise.yaml`

```yaml
id: step-tracker
kind: design
title: Steps over any date range
difficulty: medium
skills:
  - answer-range-sums
sibling: view-counter
rubric: design-review
```

`content/dsa/chapters/prefix-sums/exercises/step-tracker/statement.md`

```markdown
# Steps over any date range

A fitness app stores each user's steps per day for years. Design how it shows the total steps for any range of dates the user picks.
```

`content/dsa/chapters/prefix-sums/exercises/step-tracker/answer.md`

```markdown
# Model answer

Store a running total of steps per user per day next to the daily count. Any range is then one subtraction, whether it covers a week or five years.

If a past day's steps are corrected, every running total after it changes, so recompute from that day on.
```

## Versions

Every chapter, card, exercise, and rubric has a version, so a practice session is scored against exactly what the learner saw. `pnpm content:lock` writes them to the track's `versions.json`, which maps each item to the list of hashes it has had. The version number is the length of that list.

| Item | Its version changes when you edit |
|---|---|
| Chapter | `chapter.yaml` or `explanation.md` |
| Card | That card in `cards.yaml` |
| Exercise | Any of its files except `solutions/` |
| Rubric | Its file |

After an edit, the check fails until you run `pnpm content:lock`, which adds one version to each changed item and leaves the rest alone. It won't record versions while the track has other problems. Never edit `versions.json` by hand.

The lock also records the chapter each card is in, because learners' recall progress is stored per chapter. A card can't move to another chapter after it's locked. To move one, give it a new id in its new chapter.

## Private tracks

A track whose folder starts with `private-`, like `content/private-notes/`, is ignored by git. It follows every rule above and loads in the app like any other track, but only on the machine that has it. Use one for material that mustn't be public, such as your own stories or notes on a company. CI never sees private tracks, so the content check there passes without them.

## Stack decisions facts

The Stack decisions track holds dated facts about tools and services. Each fact file has one category from `categories.yaml`.

`content/stack-decisions/categories.yaml`

```yaml
- id: code-hosting
  name: Code hosting
```

`content/stack-decisions/facts/code-hosting.yaml`

```yaml
category: code-hosting
facts:
  - id: github-readme-limit
    claim: GitHub cuts off a README's content after 500 KiB when it's viewed on the site.
    examples:
      - product: GitHub
    sources:
      - url: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
        title: About the repository README file
    checkedOn: 2026-11-18
```

| Field | Rule |
|---|---|
| `id` | Unique in the track |
| `claim` | Text, up to 1,000 characters |
| `examples` | Optional. Products, each with a `product` and an optional `version` |
| `sources` | At least one, each with an `https://` `url` and a `title` |
| `checkedOn` | The day every source was last read, as YYYY-MM-DD, and not after today |

A category has an `id` and a `name` of up to 80 characters, and can't be listed twice. A fact is due for a recheck 6 calendar months after `checkedOn`, and it's hidden from learners from that day until it's checked again.

## Commands

Run these from the repo root.

```powershell
pnpm content:lock
```

Records hashes for new cases and versions for new or changed items, in every track.

```powershell
pnpm content:build
```

Checks every track and writes the bundle to `packages/content/dist/bundle.json`, which isn't committed. If anything is wrong, it prints each problem as `file:line`, writes nothing, and fails. CI runs it on every pull request. The API serves the bundle at `/v1/content` to signed-in users, and won't start without it.

```powershell
pnpm content:recheck
```

Lists the facts in every track that are due for a recheck, or will be within 30 days, after a line saying how many facts and tracks it read. It fails when it finds no tracks. Add `--strict` to fail on an overdue fact too, as the weekly run does.
