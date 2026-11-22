class TicketQueue:
    def __init__(self):
        # New tickets go on the inbox, and the outbox holds the oldest on top
        self.inbox = []
        self.outbox = []

    def join(self, ticket: int) -> None:
        self.inbox.append(ticket)

    def serve(self) -> int:
        self._refill()
        return self.outbox.pop()

    def front(self) -> int:
        self._refill()
        return self.outbox[-1]

    def size(self) -> int:
        return len(self.inbox) + len(self.outbox)

    def _refill(self) -> None:
        # Pouring only into an empty outbox keeps older tickets ahead of newer ones
        if self.outbox:
            return
        while self.inbox:
            self.outbox.append(self.inbox.pop())
