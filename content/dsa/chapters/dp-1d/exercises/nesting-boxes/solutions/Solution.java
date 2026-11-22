import java.util.Arrays;

class Solution {
    public int mostNested(int[][] boxes) {
        int[][] sorted = boxes.clone();
        // Width going up, and for equal widths, height going down, so equal widths can't both be picked
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1]));
        // tails[k] is the lowest height that can end a stack of k + 1 boxes
        int[] tails = new int[sorted.length];
        int size = 0;
        for (int[] box : sorted) {
            int lo = 0;
            int hi = size;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (tails[mid] >= box[1]) hi = mid;
                else lo = mid + 1;
            }
            tails[lo] = box[1];
            if (lo == size) size++;
        }
        return size;
    }
}
