export class TicketQueue {
  // New tickets go on the inbox, and the outbox holds the oldest on top
  private inbox: number[] = [];
  private outbox: number[] = [];

  join(ticket: number): void {
    this.inbox.push(ticket);
  }

  serve(): number {
    this.refill();
    return this.outbox.pop() as number;
  }

  front(): number {
    this.refill();
    return this.outbox[this.outbox.length - 1];
  }

  size(): number {
    return this.inbox.length + this.outbox.length;
  }

  // Pouring only into an empty outbox keeps older tickets ahead of newer ones
  private refill(): void {
    if (this.outbox.length > 0) return;
    while (this.inbox.length > 0) {
      this.outbox.push(this.inbox.pop() as number);
    }
  }
}
