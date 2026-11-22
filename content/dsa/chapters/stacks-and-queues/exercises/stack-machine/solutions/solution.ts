export function runProgram(steps: string[]): number[] {
  const stack: number[] = [];
  for (const step of steps) {
    if (step === "add" || step === "sub" || step === "mul") {
      // The top value is the right side
      const right = stack.pop() as number;
      const left = stack.pop() as number;
      if (step === "add") stack.push(left + right);
      else if (step === "sub") stack.push(left - right);
      else stack.push(left * right);
    } else if (step === "dup") {
      stack.push(stack[stack.length - 1]);
    } else if (step === "swap") {
      const top = stack.length - 1;
      [stack[top], stack[top - 1]] = [stack[top - 1], stack[top]];
    } else if (step === "drop") {
      stack.pop();
    } else {
      stack.push(Number(step));
    }
  }
  return stack;
}
