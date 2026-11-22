class Solution {
    public int fullestShelf(int[][] shelves) {
        int best = -1;
        int mostFull = 0;
        for (int row = 0; row < shelves.length; row++) {
            int[] slots = shelves[row];
            // Every slot before lo is empty, and every slot from hi on is full
            int lo = 0;
            int hi = slots.length;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (slots[mid] == 1) hi = mid;
                else lo = mid + 1;
            }
            int full = slots.length - lo;
            if (full > mostFull) {
                mostFull = full;
                best = row;
            }
        }
        return best;
    }
}
