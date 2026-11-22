export class CrateStack {
  private weights: number[] = [];
  // lightestSoFar[i] is the lightest weight from the bottom up to crate i
  private lightestSoFar: number[] = [];

  push(weight: number): void {
    const below =
      this.lightestSoFar.length > 0
        ? this.lightestSoFar[this.lightestSoFar.length - 1]
        : weight;
    this.weights.push(weight);
    this.lightestSoFar.push(Math.min(below, weight));
  }

  pop(): number {
    this.lightestSoFar.pop();
    return this.weights.pop() as number;
  }

  top(): number {
    return this.weights[this.weights.length - 1];
  }

  lightest(): number {
    return this.lightestSoFar[this.lightestSoFar.length - 1];
  }
}
