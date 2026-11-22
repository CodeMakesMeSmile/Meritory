import java.util.concurrent.ThreadLocalRandom;

class Solution {
    public int kthQuickest(int[] times, int k) {
        int[] order = times.clone();
        int want = k - 1;
        int start = 0;
        int end = order.length - 1;
        while (start < end) {
            int pivot = order[ThreadLocalRandom.current().nextInt(start, end + 1)];
            // Split into below, equal to, and above the pivot, as with three sizes
            int low = start;
            int mid = start;
            int high = end;
            while (mid <= high) {
                if (order[mid] < pivot) {
                    swap(order, low, mid);
                    low++;
                    mid++;
                } else if (order[mid] > pivot) {
                    swap(order, mid, high);
                    high--;
                } else {
                    mid++;
                }
            }
            // Keep going only on the side that holds position k
            if (want < low) {
                end = low - 1;
            } else if (want > high) {
                start = high + 1;
            } else {
                return pivot;
            }
        }
        return order[start];
    }

    private static void swap(int[] order, int a, int b) {
        int held = order[a];
        order[a] = order[b];
        order[b] = held;
    }
}
