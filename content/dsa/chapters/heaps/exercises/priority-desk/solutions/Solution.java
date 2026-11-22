import java.util.Arrays;

class RepairDesk {
    // A min-heap in an array, where the children of index i sit at 2i + 1 and 2i + 2
    private int[] items = new int[16];
    private int count = 0;

    public void add(int urgency) {
        if (count == items.length) items = Arrays.copyOf(items, count * 2);
        items[count] = urgency;
        // Sift up: swap with the parent while the parent is less urgent
        int i = count++;
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (items[parent] <= items[i]) break;
            swap(parent, i);
            i = parent;
        }
    }

    public int next() {
        int top = items[0];
        // Move the last job to the root, then sift it down
        items[0] = items[--count];
        int i = 0;
        while (true) {
            int left = 2 * i + 1;
            int right = left + 1;
            int smallest = i;
            if (left < count && items[left] < items[smallest]) smallest = left;
            if (right < count && items[right] < items[smallest]) smallest = right;
            if (smallest == i) break;
            swap(smallest, i);
            i = smallest;
        }
        return top;
    }

    public int peek() {
        return items[0];
    }

    public int size() {
        return count;
    }

    private void swap(int a, int b) {
        int held = items[a];
        items[a] = items[b];
        items[b] = held;
    }
}
