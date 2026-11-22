# Tags that nest

A page template is written as a list of `tags`. An opening tag is a name in lowercase letters, like `card`. A closing tag is the same name with a slash in front, like `/card`. Tags must nest, so each closing tag has to close the most recently opened tag that's still open, and have the same name.

Return the position of the first closing tag that breaks this rule, either because its name doesn't match or because nothing is open. If no closing tag breaks the rule but some tags are still open at the end, return the number of tags. If every tag nests, return -1.

## Example

With `tags = ["page", "card", "/card", "list", "/page"]`, the closing tag `/page` at position 4 arrives while `list` is still open, so the answer is 4.

With `tags = ["page", "card", "/card"]`, no closing tag breaks the rule, but `page` is still open, so the answer is 3.

## Limits

- Up to 100,000 tags, each name from 1 to 20 lowercase letters.
- Aim for O(n) time.
