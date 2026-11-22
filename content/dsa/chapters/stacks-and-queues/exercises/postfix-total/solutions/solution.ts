export function postfixTotal(tokens: string[]): number {
  const values: number[] = [];
  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      // The value pushed last is the right side
      const right = values.pop() as number;
      const left = values.pop() as number;
      if (token === "+") values.push(left + right);
      else if (token === "-") values.push(left - right);
      else if (token === "*") values.push(left * right);
      else values.push(Math.trunc(left / right));
    } else {
      values.push(Number(token));
    }
  }
  return values[0];
}
