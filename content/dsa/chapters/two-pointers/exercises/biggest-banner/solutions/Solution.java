class Solution {
    public int biggestBanner(int[] heights) {
        int best = 0;
        int left = 0;
        int right = heights.length - 1;
        while (left < right) {
            int height = Math.min(heights[left], heights[right]);
            best = Math.max(best, height * (right - left));
            // Any closer partner for the shorter post makes a smaller banner
            if (heights[left] < heights[right]) {
                left++;
            } else {
                right--;
            }
        }
        return best;
    }
}
