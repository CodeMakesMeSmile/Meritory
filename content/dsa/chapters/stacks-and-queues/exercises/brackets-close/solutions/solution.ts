export function bracketsClose(text: string): boolean {
  const partner: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const open: string[] = [];
  for (const char of text) {
    if (char === "(" || char === "[" || char === "{") {
      open.push(char);
    } else if (char in partner) {
      // Only the newest open bracket is allowed to close here
      if (open.pop() !== partner[char]) return false;
    }
  }
  return open.length === 0;
}
