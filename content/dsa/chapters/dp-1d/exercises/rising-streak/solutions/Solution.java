class Solution {
    public int longestRise(int[] heights) {
        // tails[k] is the lowest height that can end a rise of k + 1 points
        int[] tails = new int[heights.length];
        int size = 0;
        for (int height : heights) {
            // Find the first tail that's at least this height
            int lo = 0;
            int hi = size;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (tails[mid] >= height) hi = mid;
                else lo = mid + 1;
            }
            // Extend the longest rise, or give a rise of length lo + 1 a lower end
            tails[lo] = height;
            if (lo == size) size++;
        }
        return size;
    }
}
