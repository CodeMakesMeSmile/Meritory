import java.util.ArrayDeque;
import java.util.Deque;

class TicketQueue {
    // New tickets go on the inbox, and the outbox holds the oldest on top
    private final Deque<Integer> inbox = new ArrayDeque<>();
    private final Deque<Integer> outbox = new ArrayDeque<>();

    public void join(int ticket) {
        inbox.push(ticket);
    }

    public int serve() {
        refill();
        return outbox.pop();
    }

    public int front() {
        refill();
        return outbox.peek();
    }

    public int size() {
        return inbox.size() + outbox.size();
    }

    // Pouring only into an empty outbox keeps older tickets ahead of newer ones
    private void refill() {
        if (!outbox.isEmpty()) return;
        while (!inbox.isEmpty()) {
            outbox.push(inbox.pop());
        }
    }
}
