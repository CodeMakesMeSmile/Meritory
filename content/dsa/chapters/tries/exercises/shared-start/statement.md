# The start every file name shares

A photo app groups a batch of files and labels the group with the longest start that every file name in it shares. Given the file `names`, return the longest string that every name starts with. If the names share no start at all, return an empty string.

## Example

With `names = ["beach", "beachday", "beacon"]`, every name starts with `beac`, but beach and beacon differ at the next letter, so the answer is `"beac"`.

With `names = ["sunset", "moon"]`, the first letters already differ, so the answer is `""`.

## Limits

- From 1 to 1,000 names, each with from 0 to 200 lowercase letters. A name can be empty, and then the answer is empty too.
- Names can repeat.
- Aim for O(total letters) time. A trie works, but for one question, comparing the names letter by letter is simpler.
- The reference solution compares the names column by column in a loop, so it doesn't recurse.
