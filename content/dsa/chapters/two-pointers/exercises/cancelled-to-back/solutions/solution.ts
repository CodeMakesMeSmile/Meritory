export function cancelledToBack(orders: number[]): void {
  let write = 0;
  for (let read = 0; read < orders.length; read++) {
    if (orders[read] !== 0) {
      orders[write] = orders[read];
      write++;
    }
  }
  // Every kept order is packed at the front, so the rest are cancelled
  for (let i = write; i < orders.length; i++) {
    orders[i] = 0;
  }
}
