export function runningOrders(acts: number[]): number[][] {
  const orders: number[][] = [];
  const path: number[] = [];
  const used = new Array<boolean>(acts.length).fill(false);
  const build = (): void => {
    if (path.length === acts.length) {
      orders.push([...path]);
      return;
    }
    for (let i = 0; i < acts.length; i++) {
      // Any act not yet on stage can go next
      if (used[i]) continue;
      used[i] = true;
      path.push(acts[i]);
      build();
      // Undo both the path and the mark
      path.pop();
      used[i] = false;
    }
  };
  build();
  return orders;
}
